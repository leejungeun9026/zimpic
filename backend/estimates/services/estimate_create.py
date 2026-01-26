# estimates/services/estimate_create.py
from __future__ import annotations

from typing import Any, Dict, List
from django.db import transaction
from rest_framework.exceptions import ValidationError

from vision.models import VisionImage
from estimates.models import Estimate, EstimateRoom, EstimateItem
from policy.models import BoxRule, Furniture, FurnitureRotation, TruckSpec

from .packing import build_furniture_maps, compute_item_snapshot
from .truck_plan import build_truck_plan
from .distance import calculate_distance_km, DistanceError
from .pricing import build_pricing
from .context import EstimateContext


@transaction.atomic
def create_estimate(data: Dict[str, Any]) -> Estimate:
    """
    POST /api/estimates/
    1) Estimate 생성
    2) EstimateRoom 생성
    3) EstimateItem 생성 (스냅샷 포함)
    4) truck_plan 산출/저장
    5) pricing 산출/저장
    6) 응답용 prefetch 반환
    """

    # ====================================
    # 1) 거리 계산
    # ====================================
    try:
        distance_km = calculate_distance_km(
            data["origin_address"],
            data["dest_address"],
        )
    except DistanceError as e:
        print(e)
        distance_km = 0.0

    # ====================================
    # 2) Estimate 생성
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
        distance_km=distance_km,
        recommended_ton=1,
        special_item_count=0,
    )

    rooms_data: List[Dict[str, Any]] = data["rooms"]

    # ====================================
    # 3) Room 생성
    # ====================================
    vision_ids = [r["vision_image_id"] for r in rooms_data]
    vision_map = {v.id: v for v in VisionImage.objects.filter(id__in=vision_ids)}

    room_objs = [
        EstimateRoom(
            estimate=estimate,
            vision_image=vision_map.get(r["vision_image_id"]),
            sort_order=r["sort_order"],
            room_type=r.get("room_type") or "",
            image_url=r.get("image_url") or "",
        )
        for r in rooms_data
    ]
    EstimateRoom.objects.bulk_create(room_objs)

    created_rooms = list(estimate.rooms.all().order_by("sort_order", "id"))
    room_by_sort = {room.sort_order: room for room in created_rooms}

    # ====================================
    # 4) Item 생성 (스냅샷)
    # ====================================
    furniture_ids = [
        it["furniture_id"]
        for r in rooms_data
        for it in r["items"]
        if it.get("furniture_id") is not None
    ]
    furniture_map, rotation_map = build_furniture_maps(furniture_ids)

    item_objs: List[EstimateItem] = []

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
    # 5) truck_plan 산출/저장 (주입형)
    # ====================================

    # (1) BoxRule 1건 로드
    box_rule = (
        BoxRule.objects
        .filter(
            area_min_py__lte=estimate.area,
            area_max_py__gte=estimate.area,
            is_active=True,
        )
        .first()
    )
    if box_rule is None:
        raise ValidationError({"area": [f"BoxRule not found for area={estimate.area}"]})

    # (2) 'box' Furniture 로드 (name_en="box" 전제)
    box = Furniture.objects.filter(name_en="box").first()
    if box is None:
        raise ValidationError({"policy": ["Furniture(name_en='box') not found"]})

    # (3) box rotations 로드
    box_rotations = list(
        FurnitureRotation.objects
        .filter(furniture=box)
        .values_list("orientation_code", flat=True)
    ) or ["WDH"]

    # (4) truck_specs 로드 (활성 스펙 전체)
    truck_specs = {
        ts.truck_type: ts
        for ts in TruckSpec.objects.filter(is_active=True)
    }

    # (5) build_truck_plan 실행 (ctx.items = EstimateItem 스냅샷 리스트)
    plans = build_truck_plan(
        estimate=estimate,
        item_snapshots=item_objs,
        box_rule=box_rule,
        box_furniture=box,
        box_rotations=box_rotations,
        truck_specs=truck_specs,
    )

    # pricing에서 재조회 없이 쓰려면 ctx에 plans 저장
    # ctx.truck_plans = plans


    # ====================================
    # 6) pricing 산출/저장 (ctx로 주입)
    # ====================================
    ctx = EstimateContext(
        estimate=estimate,
        rooms=created_rooms,
        items=item_objs,
        furniture_map=furniture_map,
        truck_plans=plans,
    )
    build_pricing(ctx)

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
