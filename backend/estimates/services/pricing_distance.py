# estimates/services/pricing_distance.py
from __future__ import annotations

from decimal import Decimal
from typing import Tuple, Dict, List

from estimates.models import EstimatePrice, EstimatePriceSection
from policy.models import DistanceFeeRule


def _ceil_div(a: Decimal, b: Decimal) -> int:
    return int((a / b).to_integral_value(rounding="ROUND_CEILING"))

def format_truck_type_kr(truck_type: str) -> str:
    mapping = {
        "1T": "1톤",
        "2_5T": "2.5톤",
        "5T": "5톤",
        "6T": "6톤",
        "7_5T": "7.5톤",
        "10T": "10톤",
    }
    return mapping.get(truck_type, truck_type)


def calc_distance_fee(distance_km: Decimal, rule: DistanceFeeRule) -> Tuple[int, str]:
    """
    추천 톤수(=truck_type) 기준 거리요금 계산
    반환: (amount, description)
    """
    base = Decimal(str(rule.base_km))
    unit = Decimal(str(rule.unit_km))
    per = int(rule.per_unit_amount)
    truck_kr = format_truck_type_kr(rule.truck_type)

    # 20km 이내
    if distance_km <= base:
        return 0, f"{truck_kr} 기준 {int(base)}km 이내 기본요금"

    # 초과분 계산
    excess = distance_km - base
    units = _ceil_div(excess, unit)
    amount = units * per

    # base + units*unit = 요금이 적용되는 '도달 구간 km'
    billed_km = int(base + Decimal(units) * unit)

    desc = (
        f"{truck_kr} {billed_km}km 요금 적용 ({base}km 초과 시 {rule.unit_km}km 당 추가 비용 {per:,}원)"
    )
    return amount, desc


def normalize_truck_type_from_recommended_ton(recommended_ton) -> str:
    t = Decimal(str(recommended_ton or "0"))
    if t <= Decimal("1.0"):
        return "1T"
    if t <= Decimal("2.5"):
        return "2_5T"
    if t <= Decimal("5.0"):
        return "5T"
    if t <= Decimal("6.0"):
        return "6T"
    if t <= Decimal("7.5"):
        return "7_5T"
    return "7_5T"


def build_distance_pricing(
    *,
    distance_km: float,
    recommended_ton,           # estimate.recommended_ton 그대로 넣어도 됨(Decimal/str 모두 OK)
    rules: List[DistanceFeeRule],
    price: EstimatePrice,
) -> int:
    distance = Decimal(str(distance_km or 0))
    truck_type = normalize_truck_type_from_recommended_ton(recommended_ton)

    # rules를 dict로 만들어 lookup
    rule_by_type: Dict[str, DistanceFeeRule] = {r.truck_type: r for r in rules if r.is_active}

    rule = rule_by_type.get(truck_type)
    if rule is None:
        # 룰이 없으면 섹션 0 처리(또는 ValidationError)
        EstimatePriceSection.objects.create(
            estimate_price=price,
            key=EstimatePriceSection.Key.DISTANCE,
            title="거리 추가 비용",
            amount=0,
            description=f"{truck_type} 거리요금 룰 없음",
        )
        return 0

    amount, desc = calc_distance_fee(distance, rule)

    EstimatePriceSection.objects.create(
        estimate_price=price,
        key=EstimatePriceSection.Key.DISTANCE,
        title="거리 추가 비용",
        amount=amount,
        description=desc,
    )
    return amount
