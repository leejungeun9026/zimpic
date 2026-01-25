# estimates/services/pricing_special.py
from __future__ import annotations

from collections import defaultdict
from typing import Dict, List, Optional, Tuple

from django.db import transaction

from estimates.models import (
    Estimate,
    EstimatePrice,
    EstimatePriceSection,
    EstimatePriceLine,
    EstimateItem,
)
from policy.models import SpecialItemFee



DISASSEMBLY_ONLY_NAME_EN = {
    "refrigerator_lg",
    "air_conditioner_wall",
    "air_conditioner_stand",
    "bed_stone",
    "hanger_module",
}


def _extract_furniture_meta(item: EstimateItem) -> Tuple[Optional[int], Optional[str], bool]:
    """
    EstimateItem에서 furniture_id, furniture.name_en, needs_disassembly를 안전하게 꺼내기.
    - EstimateItem.furniture FK가 붙어있는 상태(estimate_create에서 넣음)라면 추가 DB 쿼리 없음.
    """
    fid = getattr(item, "furniture_id", None)

    f = getattr(item, "furniture", None)
    name_en = getattr(f, "name_en", None) if f is not None else None

    needs_disassembly = bool(getattr(item, "needs_disassembly", False))
    return fid, name_en, needs_disassembly


@transaction.atomic
def build_special_pricing(
    *,
    estimate: Estimate,
    price: EstimatePrice,
    items: List[EstimateItem],
) -> int:
    """
    SPECIAL 섹션 생성/저장 (수량 반영).

    규칙:
    1) policy_special_item_fee(SpecialItemFee)에 있는 furniture_id만 후보
    2) DISASSEMBLY_ONLY_NAME_EN에 해당하는 가구는 needs_disassembly=True일 때만 카운트
    3) 나머지는 개수만큼 unit_amount * count

    저장:
    - EstimatePriceSection(Key.SPECIAL)
    - EstimatePriceLine: amount = unit_amount * count
      description = SpecialItemFee.description (예: "어항 추가 비용")
      furniture FK 설정 (serializer에서 furniture_id 내려줄 수 있게)
    """
    # ---- 0) 기존 SPECIAL 섹션 제거(재계산 대비)
    # (estimate를 다시 계산할 수도 있으니 idempotent 하게)
    EstimatePriceSection.objects.filter(
        estimate_price=price,
        key=EstimatePriceSection.Key.SPECIAL,
    ).delete()

    # ---- 1) 정책 테이블 로드(한 번에)
    fees = list(
        SpecialItemFee.objects.select_related("furniture").filter(is_active=True)
    )
    fee_map: Dict[int, SpecialItemFee] = {f.furniture_id: f for f in fees}

    if not fee_map:
        # 정책 자체가 없으면 0
        estimate.special_item_count = 0
        estimate.save(update_fields=["special_item_count"])
        return 0

    # ---- 2) items를 순회하며 counts 집계
    counts: Dict[int, int] = defaultdict(int)

    for it in items:
        fid, name_en, needs_disassembly = _extract_furniture_meta(it)
        if not fid:
            continue

        fee = fee_map.get(fid)
        if fee is None:
            continue  # 정책에 없으면 special 아님

        # 조건부 특수짐: 분해/조립 True인 경우만 비용
        if name_en in DISASSEMBLY_ONLY_NAME_EN and not needs_disassembly:
            continue

        counts[fid] += 1

    if not counts:
        estimate.special_item_count = 0
        estimate.save(update_fields=["special_item_count"])
        return 0

    # ---- 3) 섹션 생성
    # 섹션 amount는 "합계"로
    total_amount = 0
    for fid, cnt in counts.items():
        total_amount += int(fee_map[fid].unit_amount) * cnt

    section = EstimatePriceSection.objects.create(
        estimate_price=price,
        key=EstimatePriceSection.Key.SPECIAL,
        title="특수 이삿짐 비용",
        amount=total_amount,
        description=None,
    )

    # ---- 4) 라인 생성 (라인 amount = unit_amount * count)
    lines: List[EstimatePriceLine] = []
    for fid, cnt in sorted(counts.items(), key=lambda x: x[0]):
        fee = fee_map[fid]
        line_amount = int(fee.unit_amount) * cnt

        # description에 count 정보를 포함하고 싶으면 아래처럼 확장 가능:
        # desc = f"{fee.description} × {cnt}"
        desc = fee.description

        lines.append(
            EstimatePriceLine(
                estimate_price_section=section,
                scope=None,
                furniture=fee.furniture,  # furniture_id 내려주기 위해 FK 설정
                name_kr=None,             # SPECIAL은 name_kr 안 내려줄 예정이면 굳이 저장 X
                amount=line_amount,
                description=desc,
            )
        )

    EstimatePriceLine.objects.bulk_create(lines)

    # ---- 5) estimate.special_item_count 업데이트 (총 개수 합)
    special_count = sum(counts.values())
    estimate.special_item_count = special_count
    estimate.save(update_fields=["special_item_count"])

    return total_amount
