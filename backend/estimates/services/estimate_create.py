# estimates/services/estimate_create.py
from __future__ import annotations

from typing import Any, Dict, List
from django.db import transaction
from rest_framework.exceptions import ValidationError

from vision.models import VisionImage
from estimates.models import Estimate, EstimateRoom, EstimateItem

from .packing import build_furniture_maps, compute_item_snapshot


@transaction.atomic
def create_estimate(data: Dict[str, Any]) -> Estimate:
  """
  POST /api/estimates/
  1. Estimate 생성
  2. EstimateRoom 생성
  3. EstimateItem 생성 (유저 입력 + packing 스냅샷)
  4. distance/truck_plan/pricing 호출
  """

  # ====================================
  # 1. Estimate 생성
  # ====================================
  estimate = Estimate.objects.create(
    move_type=data["move_type"],
    area=data["area"],
    origin_address=data["origin_address"],
    origin_floor=data["origin_floor"],
    origin_has_elevator=data["origin_has_elevator"],
    origin_use_ladder=data["origin_use_ladder"],
    dest_address=data["dest_address"],
    dest_floor=data["dest_floor"],
    dest_has_elevator=data["dest_has_elevator"],
    dest_use_ladder=data["dest_use_ladder"],
    distance_km=0,          # TODO distance.py
    recommended_ton=1,      # TODO truck_plan.py (나중에 Decimal 추천)
    special_item_count=0,   # TODO pricing.py or packing에서 계산
  )

  rooms_data: List[Dict[str, Any]] = data["rooms"]



  # ====================================
  # 2. Room 생성
  # ====================================
  vision_ids = [r["vision_image_id"] for r in rooms_data]
  vision_map = {v.id: v for v in VisionImage.objects.filter(id__in=vision_ids)}

  room_objs = [
      EstimateRoom(
          estimate=estimate,
          vision_image=vision_map.get(r["vision_image_id"]),
          sort_order=r["sort_order"],
          room_type="",
          image_url="",
      )
      for r in rooms_data
  ]
  EstimateRoom.objects.bulk_create(room_objs)
  created_rooms = list(estimate.rooms.all().order_by("sort_order", "id"))

  room_by_sort = {room.sort_order: room for room in created_rooms}



  # ====================================
  # 3. Item 생성
  # ====================================
  furniture_ids = [
      it["furniture_id"]
      for r in rooms_data
      for it in r["items"]
      if it.get("furniture_id") is not None
  ]
  furniture_map, rotation_map = build_furniture_maps(furniture_ids)

  item_objs = []

  for r in rooms_data:
      room = room_by_sort[r["sort_order"]]
      for it in r["items"]:
          furniture_id = it["furniture_id"]
          furniture = furniture_map.get(furniture_id)
          if furniture is None:
              raise ValidationError({"rooms": [f"Invalid furniture_id: {furniture_id}"]})

          size = it["size_cm"]
          w = float(size["w_cm"])
          d = float(size["d_cm"])
          h = float(size["h_cm"])

          snapshot = compute_item_snapshot(
              furniture=furniture,
              w_cm=w,
              d_cm=d,
              h_cm=h,
              needs_disassembly=it["needs_disassembly"],
              rotation_codes=rotation_map.get(furniture_id, []),
          )

          item_objs.append(
              EstimateItem(
                  estimate_room=room,
                  furniture=furniture,
                  **snapshot,
              )
          )

  EstimateItem.objects.bulk_create(item_objs)


  # ====================================
  # 4. distance/truck_plan/pricing 호출
  # ====================================
  # TODO: distance.py로 distance_km 채우기
  # TODO: truck_plan.py로 recommended_ton / truck_plans 생성
  # TODO: pricing.py로 price/sections/lines 생성

  # 응답 최적화를 위해 prefetch된 상태로 반환
  estimate = (
      Estimate.objects
      .select_related("price")
      .prefetch_related(
          "truck_plans",
          "rooms__items",
          "price__sections__lines",
      )
      .get(id=estimate.id)
  )
  return estimate
