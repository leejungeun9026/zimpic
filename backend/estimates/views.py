from django.db import transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import (
  Estimate,
  EstimateRoom,
  EstimateItem,
  EstimateTruckPlan,
  EstimatePrice,
  EstimatePriceSection,
  EstimatePriceLine,
)

from vision.models import VisionImage
from policy.models import Furniture


def calculate_distance_km(origin_address: str, dest_address: str) -> float:
  """
  TODO: 카카오/네이버/OSRM 등 거리계산 붙이기
  """
  return 0.0


def build_truck_plan(estimate: Estimate) -> list[dict]:
  """
  TODO: 추천 톤수/적재공간 정책 반영
  return 예:
  [
    {"truck_type":"5T","truck_count":1,"inner_w_cm":230,"inner_d_cm":620,"inner_h_cm":230},
    {"truck_type":"1T","truck_count":1,"inner_w_cm":160,"inner_d_cm":270,"inner_h_cm":160},
  ]
  """
  return []


def enrich_item_from_furniture(furniture: Furniture, size_cm: dict, needs_disassembly: bool) -> dict:
  """
  furniture 기반으로 padding/packed_size/stacking/allowed_rotations 등을 채움
  TODO: 너의 furniture 스키마에 맞게 연결
  """
  w = size_cm["w"]
  d = size_cm["d"]
  h = size_cm["h"]

  padding = float(getattr(furniture, "padding_cm", 0.0))
  packed = {"w": w + padding * 2, "d": d + padding * 2, "h": h + padding * 2}

  stacking = getattr(furniture, "stacking", None)
  stackable = getattr(stacking, "stackable", False) if stacking else False
  can_stack_on_top = getattr(stacking, "can_stack_on_top", False) if stacking else False

  allowed = getattr(furniture, "allowed_rotations", ["WDH", "DWH"])

  return {
    "name_kr": getattr(furniture, "name_kr", None),
    "padding_cm": padding,
    "packed_size_cm": packed,
    "stackable": stackable,
    "can_stack_on_top": can_stack_on_top,
    "allowed_rotations": allowed,
    "needs_disassembly": needs_disassembly,
  }


def calculate_pricing(estimate: Estimate) -> dict:
  """
  TODO: policy 테이블 기반 실제 계산 붙이기
  return은 응답 스펙 그대로
  """
  return {
    "total_amount": 0,
    "sections": [],
  }


class EstimateCreateAPIView(APIView):
  @swagger_auto_schema(
    tags=["Estimates"],
    request_body=openapi.Schema(
      type=openapi.TYPE_OBJECT,
      properties={
        "move_type": openapi.Schema(type=openapi.TYPE_STRING),
        "area": openapi.Schema(type=openapi.TYPE_INTEGER),
        "origin": openapi.Schema(
          type=openapi.TYPE_OBJECT,
          properties={
            "address": openapi.Schema(type=openapi.TYPE_STRING),
            "floor": openapi.Schema(type=openapi.TYPE_INTEGER),
            "has_elevator": openapi.Schema(type=openapi.TYPE_BOOLEAN),
            "use_ladder": openapi.Schema(type=openapi.TYPE_BOOLEAN),
          },
          required=["address", "floor", "has_elevator", "use_ladder"],
        ),
        "dest": openapi.Schema(
          type=openapi.TYPE_OBJECT,
          properties={
            "address": openapi.Schema(type=openapi.TYPE_STRING),
            "floor": openapi.Schema(type=openapi.TYPE_INTEGER),
            "has_elevator": openapi.Schema(type=openapi.TYPE_BOOLEAN),
            "use_ladder": openapi.Schema(type=openapi.TYPE_BOOLEAN),
          },
          required=["address", "floor", "has_elevator", "use_ladder"],
        ),
        "rooms": openapi.Schema(
          type=openapi.TYPE_ARRAY,
          items=openapi.Items(
            type=openapi.TYPE_OBJECT,
            properties={
              "vision_image_id": openapi.Schema(type=openapi.TYPE_INTEGER),
              "items": openapi.Schema(
                type=openapi.TYPE_ARRAY,
                items=openapi.Items(
                  type=openapi.TYPE_OBJECT,
                  properties={
                    "item_id": openapi.Schema(type=openapi.TYPE_STRING),
                    "furniture_id": openapi.Schema(type=openapi.TYPE_INTEGER),
                    "size_cm": openapi.Schema(
                      type=openapi.TYPE_OBJECT,
                      properties={
                        "w": openapi.Schema(type=openapi.TYPE_NUMBER),
                        "d": openapi.Schema(type=openapi.TYPE_NUMBER),
                        "h": openapi.Schema(type=openapi.TYPE_NUMBER),
                      },
                      required=["w", "d", "h"],
                    ),
                    "needs_disassembly": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                  },
                  required=["item_id", "furniture_id", "size_cm", "needs_disassembly"],
                ),
              ),
            },
            required=["vision_image_id", "items"],
          ),
        ),
      },
      required=["move_type", "area", "origin", "dest", "rooms"],
    ),
    responses={201: "estimate response"},
  )
  @transaction.atomic
  def post(self, request):
    data = request.data

    origin = data["origin"]
    dest = data["dest"]

    # 1) 거리 계산 (요청에 없으니 서버에서 채움)
    distance_km = calculate_distance_km(origin["address"], dest["address"])

    # 2) Estimate 생성 (요청 스펙 → 너의 Estimate 테이블 컬럼에 매핑)
    estimate = Estimate.objects.create(
      move_type=data["move_type"],
      area=data["area"],
      origin_address=origin["address"],
      origin_floor=origin["floor"],
      origin_has_elevator=origin["has_elevator"],
      origin_use_ladder=origin["use_ladder"],
      dest_address=dest["address"],
      dest_floor=dest["floor"],
      dest_has_elevator=dest["has_elevator"],
      dest_use_ladder=dest["use_ladder"],
      distance_km=distance_km,
      recommended_ton=0,          # TODO: 추천톤 계산
      special_item_count=0,       # TODO: 특수짐 계산
    )

    # 3) rooms/items 스냅샷 저장 + 응답용 rooms 구성
    resp_rooms = []
    for idx, room in enumerate(data["rooms"]):
      vision_image = VisionImage.objects.get(id=room["vision_image_id"])

      er = EstimateRoom.objects.create(
        estimate=estimate,
        vision_image=vision_image,
        room_type=vision_image.room_type,
        image_url=vision_image.image_url,
        sort_order=idx,
      )

      resp_items = []
      for it in room["items"]:
        furniture = Furniture.objects.get(id=it["furniture_id"])
        size_cm = it["size_cm"]
        needs_disassembly = bool(it["needs_disassembly"])

        enriched = enrich_item_from_furniture(furniture, size_cm, needs_disassembly)

        item_row = EstimateItem.objects.create(
          estimate_room=er,
          item_id=it["item_id"],
          furniture=furniture,

          w_cm=size_cm["w"],
          d_cm=size_cm["d"],
          h_cm=size_cm["h"],

          padding_cm=enriched["padding_cm"],

          packed_w_cm=enriched["packed_size_cm"]["w"],
          packed_d_cm=enriched["packed_size_cm"]["d"],
          packed_h_cm=enriched["packed_size_cm"]["h"],

          stackable=enriched["stackable"],
          can_stack_on_top=enriched["can_stack_on_top"],
          allowed_rotations_json=enriched["allowed_rotations"],
          needs_disassembly=enriched["needs_disassembly"],
        )

        resp_items.append({
          "item_id": it["item_id"],
          "furniture_id": furniture.id,
          "name_kr": enriched["name_kr"],
          "size_cm": size_cm,
          "padding_cm": enriched["padding_cm"],
          "packed_size_cm": enriched["packed_size_cm"],
          "stacking": {
            "stackable": enriched["stackable"],
            "can_stack_on_top": enriched["can_stack_on_top"],
          },
          "allowed_rotations": enriched["allowed_rotations"],
          "needs_disassembly": enriched["needs_disassembly"],
        })

      resp_rooms.append({
        "vision_image_id": vision_image.id,
        "room_type": vision_image.room_type,
        "image_url": vision_image.image_url,
        "sort_order": er.sort_order,
        "items": resp_items,
      })

    # 4) 트럭 플랜 생성/저장 + 응답 구성
    truck_plan = build_truck_plan(estimate)
    resp_truck_plan = []
    for tp in truck_plan:
      EstimateTruckPlan.objects.create(
        estimate=estimate,
        truck_type=tp["truck_type"],
        truck_count=tp["truck_count"],
        inner_w_cm=tp["inner_w_cm"],
        inner_d_cm=tp["inner_d_cm"],
        inner_h_cm=tp["inner_h_cm"],
      )
      resp_truck_plan.append({
        "truck_type": tp["truck_type"],
        "truck_count": tp["truck_count"],
        "inner_size_cm": {
          "w": tp["inner_w_cm"],
          "d": tp["inner_d_cm"],
          "h": tp["inner_h_cm"],
        }
      })

    # 5) 가격 계산 + 스냅샷 저장 + 응답 pricing 구성
    pricing = calculate_pricing(estimate)

    price_row = EstimatePrice.objects.create(
      estimate=estimate,
      total_amount=pricing["total_amount"],
      calculated_at=estimate.created_at,  # TODO: now()
    )

    resp_sections = []
    for sec in pricing["sections"]:
      sec_row = EstimatePriceSection.objects.create(
        estimate_price=price_row,
        key=sec["key"],
        title=sec["title"],
        amount=sec["amount"],
        description=sec.get("description"),
      )

      lines = sec.get("lines") or []
      resp_lines = []
      for ln in lines:
        furniture_id = ln.get("furniture_id")
        furniture = Furniture.objects.filter(id=furniture_id).first() if furniture_id else None

        EstimatePriceLine.objects.create(
          estimate_price_section=sec_row,
          scope=ln.get("scope"),
          furniture=furniture,
          name_kr=ln.get("name_kr"),
          amount=ln["amount"],
          description=ln.get("description"),
        )

        resp_lines.append({k: v for k, v in ln.items()})

      sec_payload = {
        "key": sec["key"],
        "title": sec["title"],
        "amount": sec["amount"],
      }
      if sec.get("description") is not None:
        sec_payload["description"] = sec["description"]
      if resp_lines:
        sec_payload["lines"] = resp_lines

      resp_sections.append(sec_payload)

    # 6) 최종 응답(너의 스펙 그대로)
    response = {
      "estimate_id": estimate.id,

      "summary": {
        "move_type": estimate.move_type,
        "area": estimate.area,
        "origin": {
          "address": estimate.origin_address,
          "floor": estimate.origin_floor,
          "has_elevator": estimate.origin_has_elevator,
          "use_ladder": estimate.origin_use_ladder,
        },
        "dest": {
          "address": estimate.dest_address,
          "floor": estimate.dest_floor,
          "has_elevator": estimate.dest_has_elevator,
          "use_ladder": estimate.dest_use_ladder,
        },
        "distance_km": float(estimate.distance_km),
        "recommended_ton": estimate.recommended_ton,
        "truck_plan": resp_truck_plan,
        "special_item_count": estimate.special_item_count,
      },

      "rooms": resp_rooms,

      "pricing": {
        "total_amount": pricing["total_amount"],
        "sections": resp_sections,
      }
    }

    return Response(response, status=status.HTTP_201_CREATED)
