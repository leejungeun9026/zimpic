# estimates/services/pricing_access.py
from __future__ import annotations

from typing import List, Optional

from estimates.models import EstimatePrice, EstimatePriceSection, EstimatePriceLine, EstimateTruckPlan
from policy.models import LadderFeeRule, StairsFeeRule


def _truck_type_rank(truck_type: str) -> float:
    mapping = {"1T": 1.0, "2_5T": 2.5, "5T": 5.0, "6T": 6.0, "7_5T": 7.5, "10T": 10.0}
    return mapping.get(truck_type, 0.0)


def _pick_ladder_group(plans: List[EstimateTruckPlan]) -> str:
    """
    사다리차 그룹은 '가장 큰 트럭 기준'으로 선택.
    6T/7.5T/10T는 룰이 없다면 5T로 매핑.
    """
    if not plans:
        return "1T"
    main = max((p.truck_type for p in plans if p.truck_type), key=_truck_type_rank, default="1T")
    if main in ("6T", "7_5T", "10T"):
        return "5T"
    return main


def _pick_ladder_rule(group: str, floor: int, rules: List[LadderFeeRule]) -> Optional[LadderFeeRule]:
    candidates = [r for r in rules if r.ladder_truck_group == group and r.floor_from <= floor <= r.floor_to]
    if not candidates:
        return None
    return min(candidates, key=lambda r: (r.floor_to - r.floor_from))


def _pick_stairs_rule(floor: int, rules: List[StairsFeeRule]) -> Optional[StairsFeeRule]:
    candidates = [r for r in rules if r.floor_from <= floor <= r.floor_to]
    if not candidates:
        return None
    return min(candidates, key=lambda r: (r.floor_to - r.floor_from))


def _calc_stairs_amount(floor: int, per_floor_amount: int) -> int:
    # 1층은 0으로 보는 정책(층-1)
    effective = max(floor - 1, 0)
    return effective * int(per_floor_amount)


def build_access_pricing(
    *,
    price: EstimatePrice,
    plans: List[EstimateTruckPlan],
    ladder_rules: List[LadderFeeRule],
    stairs_rules: List[StairsFeeRule],
    origin_floor: int,
    origin_has_elevator: bool,
    origin_use_ladder: bool,
    dest_floor: int,
    dest_has_elevator: bool,
    dest_use_ladder: bool,
) -> int:
    ladder_group = _pick_ladder_group(plans)

    ladder_total = 0
    stairs_total = 0
    ladder_lines: List[EstimatePriceLine] = []
    stairs_lines: List[EstimatePriceLine] = []

    def handle(scope: str, floor: int, has_elevator: bool, use_ladder: bool):
        nonlocal ladder_total, stairs_total

        if has_elevator:
            return

        if use_ladder:
            rule = _pick_ladder_rule(ladder_group, floor, ladder_rules)
            if not rule:
                return
            amount = int(rule.base_amount)
            ladder_total += amount
            ladder_lines.append(
                EstimatePriceLine(
                    estimate_price_section=None,
                    scope=scope,  # "ORIGIN"/"DEST"
                    amount=amount,
                    description=f"{'출발지' if scope=='ORIGIN' else '도착지'} {floor}층 기준",
                )
            )
        else:
            rule = _pick_stairs_rule(floor, stairs_rules)
            if not rule:
                return
            amount = _calc_stairs_amount(floor, int(rule.per_floor_amount))
            stairs_total += amount
            stairs_lines.append(
                EstimatePriceLine(
                    estimate_price_section=None,
                    scope=scope,
                    amount=amount,
                    description=f"{'출발지' if scope=='ORIGIN' else '도착지'} {floor}층 기준",
                )
            )

    handle("ORIGIN", origin_floor, origin_has_elevator, origin_use_ladder)
    handle("DEST", dest_floor, dest_has_elevator, dest_use_ladder)

    total = 0

    if ladder_total > 0:
        sec = EstimatePriceSection.objects.create(
            estimate_price=price,
            key=EstimatePriceSection.Key.LADDER,
            title="사다리차 비용",
            amount=ladder_total,
        )
        for ln in ladder_lines:
            ln.estimate_price_section = sec
        EstimatePriceLine.objects.bulk_create(ladder_lines)
        total += ladder_total

    if stairs_total > 0:
        sec = EstimatePriceSection.objects.create(
            estimate_price=price,
            key=EstimatePriceSection.Key.STAIRS,
            title="계단 비용",
            amount=stairs_total,
        )
        for ln in stairs_lines:
            ln.estimate_price_section = sec
        EstimatePriceLine.objects.bulk_create(stairs_lines)
        total += stairs_total

    return total
