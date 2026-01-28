# estimates/services/estimate_create.py
from __future__ import annotations

from typing import Any, Dict, List
from django.db import transaction
from rest_framework.exceptions import ValidationError

from vision.models import VisionImage
from estimates.models import Estimate, EstimateRoom, EstimateItem, EstimatePrice
from policy.models import BoxRule, Furniture, FurnitureRotation, TruckSpec

from .packing import build_furniture_maps, compute_item_snapshot
from .truck_plan import build_truck_plan
from .distance import calculate_distance_km, DistanceError
from .pricing import build_pricing
from .context import EstimateContext



def _get(data: Dict[str, Any], key: str, default=None):
  # 데이터 누락 대비
  return data.get(key, default)




@transaction.atomic
def create_estimate(data: Dict[str, Any]) -> Estimate:
  """
  POST /api/estimates/
  - 입력(payload) 기준으로 견적 1건 (Estimate) 생성
  - 산출 결과를 DB에 저장한 뒤
  - 응답용으로 prefetch된 Estimate를 반환

  처리 흐름:
  1) 발지/도착지 주소 기반 거리(distance_km) 계산
  2) Estimate 생성 (기본 필드)
  3) EstimateRoom 생성
  4) EstimateItem 생성
  5) truck_plan 산출/저장 + Estimate 필드 업데이트
  6) pricing 산출/저장 + Estimate 필드 업데이트
  7) 응답 Estimate 반환
  """


  # ====================================
  # 0) 요청 입력값 검증
  # ====================================
  rooms_data: List[Dict[str, Any]] = data.get("rooms") or []
  if not isinstance(rooms_data, list) or len(rooms_data) == 0:
    raise ValidationError({"rooms": ["rooms is required and must be a non-empty list"]})

  for idx, r in enumerate(rooms_data):
    if r.get("sort_order") is None:
      r["sort_order"] = idx



  # ====================================
  # 1) 거리 계산
  # ====================================
  origin_address = data["origin_address"]   # 출발지 주소
  dest_address = _get(data, "dest_address") # 도착지 주소
  
  if dest_address is not None and str(dest_address).strip() == "" :
    dest_address = None
  
  dest_floor = _get(data, "dest_floor")  # 없으면 None
  dest_has_elevator = _get(data, "dest_has_elevator", None)
  dest_use_ladder = _get(data, "dest_use_ladder", None)


  # dest가 없거나 빈 문자열이면 기본거리
  if dest_address is None:
    distance_km = 0.0
  else:
    try:
      distance_km = float(calculate_distance_km(origin_address, dest_address))
    except DistanceError:
      distance_km = 0.0



  # ====================================
  # 2) Estimate 생성 (유저 입력값만)
  # ====================================
  estimate = Estimate.objects.create(
    move_type=data["move_type"],
    area=data["area"],

    origin_address=origin_address,
    origin_floor=data["origin_floor"],
    origin_has_elevator=data["origin_has_elevator"],
    origin_use_ladder=data["origin_use_ladder"],

    dest_address=dest_address,
    dest_floor=dest_floor,
    dest_has_elevator=dest_has_elevator,
    dest_use_ladder=dest_use_ladder,
  )



  # ====================================
  # 3) Room 생성
  # ====================================
  vision_ids = [r.get("vision_image_id") for r in rooms_data if r.get("vision_image_id")]
  vision_map = {v.id: v for v in VisionImage.objects.filter(id__in=vision_ids)}

  room_objs: List[EstimateRoom] = []
  for r in rooms_data:
    room_objs.append(
      EstimateRoom(
        estimate=estimate,
        vision_image=vision_map.get(r.get("vision_image_id")),
        sort_order=r["sort_order"],
        room_type=_get(r, "room_type", "") or "",
        image_url=_get(r, "image_url", "") or "",
      )
    )
  EstimateRoom.objects.bulk_create(room_objs)

  created_rooms = list(estimate.rooms.all().order_by("sort_order", "id"))
  room_by_sort = {room.sort_order: room for room in created_rooms}
  if len(room_by_sort) != len(created_rooms):
    raise ValidationError({"rooms": ["duplicate sort_order detected"]})



  # ====================================
  # 4) Item 생성 (스냅샷)
  # ====================================
  furniture_ids = [
    it.get("furniture_id")
    for r in rooms_data
    for it in (r.get("items") or [])
    if it.get("furniture_id") is not None
  ]
  if not furniture_ids:
    raise ValidationError({"rooms": ["at least one item with furniture_id is required"]})

  furniture_map, rotation_map = build_furniture_maps(furniture_ids)

  item_objs: List[EstimateItem] = []
  for r in rooms_data:
    room = room_by_sort.get(r["sort_order"])
    if room is None:
      raise ValidationError({"rooms": [f"invalid sort_order: {r['sort_order']}"]})

    for it in (r.get("items") or []):
      furniture_id = it.get("furniture_id")
      furniture = furniture_map.get(furniture_id)
      if furniture is None:
        raise ValidationError({"rooms": [f"Invalid furniture_id: {furniture_id}"]})

      size = it.get("size_cm") or {}
      try:
        w = float(size["w_cm"])
        d = float(size["d_cm"])
        h = float(size["h_cm"])
      except KeyError:
        raise ValidationError({"rooms": ["size_cm must include w_cm, d_cm, h_cm"]})

      snapshot = compute_item_snapshot(
        furniture=furniture,
        w_cm=w,
        d_cm=d,
        h_cm=h,
        needs_disassembly=bool(it.get("needs_disassembly", False)),
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
  # 5) truck_plan 산출/저장 (+ 박스룰 산출)
  # ====================================
  box_rule = (
    BoxRule.objects
    .filter(area_min_py__lte=estimate.area, area_max_py__gte=estimate.area, is_active=True)
    .first()
  )

  if box_rule is None:
    raise ValidationError({"area": [f"BoxRule not found for area={estimate.area}"]})

  box = Furniture.objects.filter(name_en="box").first()
  if box is None:
    raise ValidationError({"policy": ["Furniture(name_en='box') not found"]})

  box_rotations = list(
    FurnitureRotation.objects.filter(furniture=box).values_list("orientation_code", flat=True)
  ) or ["WDH"]

  truck_specs = {ts.truck_type: ts for ts in TruckSpec.objects.filter(is_active=True)}
  if not truck_specs:
    raise ValidationError({"policy": ["No active TruckSpec found"]})

  plans, truck_summary = build_truck_plan(
    estimate=estimate,
    item_snapshots=item_objs,
    box_rule=box_rule,
    box_furniture=box,
    box_rotations=box_rotations,
    truck_specs=truck_specs,
  )



  # ====================================
  # 6) pricing 산출/저장
  # ====================================
  ctx = EstimateContext(
    estimate=estimate,
    rooms=created_rooms,
    items=item_objs,
    furniture_map=furniture_map,
    truck_plans=plans,
  )

  # price row 생성/업데이트(중복 없이 1번)
  price, _ = EstimatePrice.objects.update_or_create(
    estimate=estimate,
    defaults={
      "distance_km": distance_km,
      "recommended_ton": truck_summary.get("recommended_ton"),
      "total_cbm": truck_summary.get("total_cbm"),
      "truck_capacity_cbm": truck_summary.get("truck_capacity_cbm"),
      "load_factor_pct": truck_summary.get("load_factor_pct"),
      "remaining_cbm": truck_summary.get("remaining_cbm"),
      "boxes_count": truck_summary.get("boxes_count"),
      "boxes_description": truck_summary.get("boxes_description"),
      "special_item_count": 0,
      "total_amount": 0,
    }
  )

  pricing_result = build_pricing(ctx)
  if not isinstance(pricing_result, (dict, int)):
    raise ValueError(f"build_pricing() returned unsupported type: {type(pricing_result)}")

  special_item_count = 0
  total_amount = 0
  if isinstance(pricing_result, dict):
    special_item_count = int(pricing_result.get("special_item_count") or 0)
    total_amount = int(pricing_result.get("total_amount") or 0)
  else:  # int
    total_amount = int(pricing_result)

  # pricing 결과를 price에 반영(저장 1번)
  price.special_item_count = special_item_count
  price.total_amount = total_amount
  price.save(update_fields=["special_item_count", "total_amount"])


  # ====================================
  # 7) 응답 최적화 prefetch 반환
  # ====================================
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
