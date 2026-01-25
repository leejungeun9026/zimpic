from __future__ import annotations

from typing import Dict, Tuple, List
from django.db import transaction
from django.utils import timezone

from estimates.models import EstimatePrice, EstimatePriceSection
from policy.models import BasePrice, LadderFeeRule, StairsFeeRule, DistanceFeeRule

from .context import EstimateContext
from .pricing_distance import build_distance_pricing
from .pricing_access import build_access_pricing
from .pricing_special import build_special_pricing


def _truck_type_rank(truck_type: str) -> float:
    # 비교용 톤수
    mapping = {
        "1T": 1.0,
        "2_5T": 2.5,
        "5T": 5.0,
        "6T": 6.0,
        "7_5T": 7.5,
        "10T": 10.0,
    }
    return mapping.get(truck_type, 0.0)


def _pick_main_truck_type(plans) -> str | None:
    if not plans:
        return None
    return max((p.truck_type for p in plans if p.truck_type), key=_truck_type_rank, default=None)


def _build_base_section(
    *,
    ctx: EstimateContext,
    price: EstimatePrice,
    base_map: Dict[Tuple[str, str], BasePrice],
) -> int:
    """
    BASE 섹션 생성 (라인 없음)
    """
    estimate = ctx.estimate
    plans = ctx.truck_plans
    main_truck = _pick_main_truck_type(plans)

    amount = 0
    desc = None

    if main_truck:
        rule = base_map.get((estimate.move_type, main_truck))
        if rule:
            amount = int(rule.base_amount)
            # note가 있으면 그것 우선
            if rule.note:
                desc = f"{main_truck} {estimate.move_type} 기준 ({rule.note})"
            else:
                desc = f"{main_truck} {estimate.move_type} 기준 (작업자 {rule.included_workers}명)"

    EstimatePriceSection.objects.create(
        estimate_price=price,
        key=EstimatePriceSection.Key.BASE,
        title="기본 이사 비용",
        amount=amount,
        description=desc,
    )
    return amount


@transaction.atomic
def build_pricing(ctx: EstimateContext) -> None:
    estimate = ctx.estimate
    plans = ctx.truck_plans
    items = ctx.items

    # 1) price upsert (calculated_at 꼭 넣기)
    price, _ = EstimatePrice.objects.update_or_create(
        estimate=estimate,
        defaults={
            "total_amount": 0,
            "calculated_at": timezone.now(),
        },
    )

    # 2) 재계산 대비: 섹션 삭제(라인은 CASCADE면 같이 삭제)
    EstimatePriceSection.objects.filter(estimate_price=price).delete()

    # 3) policy 룰 한 번에 로드
    base_map: Dict[Tuple[str, str], BasePrice] = {
        (r.move_type, r.truck_type): r
        for r in BasePrice.objects.filter(is_active=True)
    }
    ladder_rules = list(LadderFeeRule.objects.filter(is_active=True))
    stairs_rules = list(StairsFeeRule.objects.filter(is_active=True))
    distance_rules = list(DistanceFeeRule.objects.filter(is_active=True))
    # ✅ special은 build_special_pricing 내부에서 SpecialItemFee 로드하니까 여기서 안 해도 됨

    # 4) 섹션 생성 + 합산
    total = 0

    total += _build_base_section(ctx=ctx, price=price, base_map=base_map)

    total += build_access_pricing(
        price=price,
        plans=plans,
        ladder_rules=ladder_rules,
        stairs_rules=stairs_rules,
        origin_floor=int(estimate.origin_floor or 0),
        origin_has_elevator=bool(estimate.origin_has_elevator),
        origin_use_ladder=bool(estimate.origin_use_ladder),
        dest_floor=int(estimate.dest_floor or 0),
        dest_has_elevator=bool(estimate.dest_has_elevator),
        dest_use_ladder=bool(estimate.dest_use_ladder),
    )

    total += build_distance_pricing(
        distance_km=float(estimate.distance_km or 0),
        recommended_ton=estimate.recommended_ton,
        rules=distance_rules,
        price=price,
    )

    # ✅ SPECIAL은 한 번만 호출
    total += build_special_pricing(
        estimate=estimate,
        price=price,
        items=items,
    )

    # 5) total 저장
    price.total_amount = int(total)
    price.save(update_fields=["total_amount"])
