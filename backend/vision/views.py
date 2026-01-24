import json

from django.db import transaction
from django.core.files.storage import default_storage

from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import VisionImage, VisionDetection
from policy.models import Furniture


def run_vision_inference(file_path: str) -> list[dict]:
  """
  TODO: 여기에 실제 YOLO 추론 붙이기
  return 예시:
  [
    {
      "yolo_id": 0,
      "yolo_class": "sofa_sm",
      "confidence": 0.92,
      "bbox": {"x":0.48,"y":0.75,"w":0.31,"h":0.22},
    }
  ]
  """
  return []


def map_to_furniture(yolo_class: str) -> Furniture | None:
  """
  TODO: 매핑 전략에 맞게 수정
  - name_en == yolo_class
  - 또는 code 필드가 있으면 code 매칭
  """
  return Furniture.objects.filter(name_en=yolo_class).first()


class VisionUploadAPIView(APIView):
  parser_classes = [MultiPartParser, FormParser]

  rooms_param = openapi.Parameter(
    name="rooms",
    in_=openapi.IN_FORM,
    type=openapi.TYPE_STRING,
    required=True,
    description=(
      "JSON 문자열. 예: "
      "[{\"room_type\":\"LIVING\",\"image_field\":\"room0\",\"sort_order\":0}] "
      "image_field는 업로드 파일의 form field name"
    ),
  )

  @swagger_auto_schema(
    tags=["Vision"],
    manual_parameters=[rooms_param],
    consumes=["multipart/form-data"],
    responses={
      201: openapi.Response(
        description="업로드 결과",
        examples={
          "application/json": {
            "results": [
              {
                "vision_image_id": 1,
                "room_type": "LIVING",
                "image_url": "https://...",
                "detections": [
                  {
                    "detection_id": 1001,
                    "furniture_id": 5,
                    "name_kr": "소파(소형)",
                    "name_en": "sofa_sm",
                    "category": "GENERAL_FURNITURE",
                    "confidence": 0.92,
                    "bbox": {"x": 0.48, "y": 0.75, "w": 0.31, "h": 0.22},
                    "guide_size_cm": {"w": 300, "d": 100, "h": 200},
                    "needs_disassembly": False
                  }
                ]
              }
            ]
          }
        },
      )
    },
  )
  @transaction.atomic
  def post(self, request):
    rooms_raw = request.data.get("rooms")
    if not rooms_raw:
      return Response({"detail": "rooms is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
      rooms = json.loads(rooms_raw)
      if not isinstance(rooms, list):
        raise ValueError
    except Exception:
      return Response({"detail": "rooms must be a JSON list string"}, status=status.HTTP_400_BAD_REQUEST)

    results = []

    for room in rooms:
      room_type = room.get("room_type")
      image_field = room.get("image_field")
      sort_order = room.get("sort_order", 0)

      if not room_type or not image_field:
        return Response(
          {"detail": "each room requires room_type, image_field"},
          status=status.HTTP_400_BAD_REQUEST,
        )

      uploaded = request.FILES.get(image_field)
      if not uploaded:
        return Response(
          {"detail": f"file not found for image_field='{image_field}'"},
          status=status.HTTP_400_BAD_REQUEST,
        )

      # 1) 파일 저장 (원하면 VisionImage에 ImageField 두고 저장하는 방식으로 바꿔도 됨)
      saved_path = default_storage.save(f"vision/{uploaded.name}", uploaded)

			# ImageField 저장 (파일은 media/vision/ 아래로 저장됨)
      vision_image = VisionImage.objects.create(
        room_type=room_type,
        image_file_name=uploaded.name,
        image=uploaded,
        sort_order=sort_order,
      )

			# 절대 URL 만들어서 응답에 넣기
      image_url = request.build_absolute_uri(vision_image.image.url)

			# DB 저장
      if not vision_image.image_url:
        vision_image.image_url = image_url
        vision_image.save(update_fields=["image_url"])

      # TODO: 추론 실행 + VisionDetection 저장
      # local_path = vision_image.image.path
      # detections = run_vision_inference(local_path)  # 로컬 파일 경로

      # 2) 비전 추론
      detections = run_vision_inference(saved_path)

      # 3) 저장 + 응답용 데이터 구성
      resp_dets = []
      for det in detections:
        yolo_id = det.get("yolo_id")
        yolo_class = str(det.get("yolo_class"))
        confidence = det.get("confidence")
        bbox = det.get("bbox") or {}

        furniture = map_to_furniture(yolo_class)

        d = VisionDetection.objects.create(
          vision_image=vision_image,
          yolo_id=yolo_id,
          yolo_class=yolo_class,
          furniture=furniture,
          confidence=confidence,
          bbox_x=bbox.get("x"),
          bbox_y=bbox.get("y"),
          bbox_w=bbox.get("w"),
          bbox_h=bbox.get("h"),
        )

        # furniture에서 프론트 “가구 수정 화면”에 필요한 필드들 내려주기
        resp_dets.append({
          "detection_id": d.id,
          "furniture_id": furniture.id if furniture else None,
          "name_kr": getattr(furniture, "name_kr", None),
          "name_en": getattr(furniture, "name_en", None),
          "category": getattr(furniture, "category", None),
          "confidence": float(confidence) if confidence is not None else None,
          "bbox": {
            "x": float(d.bbox_x),
            "y": float(d.bbox_y),
            "w": float(d.bbox_w),
            "h": float(d.bbox_h),
          },
          "guide_size_cm": getattr(furniture, "guide_size_cm", None),
          "needs_disassembly": getattr(furniture, "needs_disassembly_default", False),
        })

      results.append({
        "vision_image_id": vision_image.id,
        "room_type": vision_image.room_type,
        "image_url": image_url,
        "detections": resp_dets,
      })

    return Response({"results": results}, status=status.HTTP_201_CREATED)