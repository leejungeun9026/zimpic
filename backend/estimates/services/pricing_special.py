from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from collections import Counter

from policy.models import SpecialItemFee
from estimates.models import EstimateItem
from .context import EstimateContext


class SpecialPricingError(Exception):
  """특수옵션(분해/설치 등) 요금 산출 중 정책 누락/데이터 오류."""


@dataclass(frozen=True)
class SpecialLine:
  furniture_id: int
  name_kr: str
  qty: int
  unit_amount: int
  amount: int
  description: Optional[str] = None


def calc_special_cost(ctx: EstimateContext) -> Tuple[int, int, List[SpecialLine]]:
  """
  특수 옵션 비용 산출
  전제: SpecialItemFee에 있는 furniture만 대상

  규칙:
  - Furniture.needs_disassembly == True:
      요청(EstimateItem.needs_disassembly)이 True인 개수만 과금
  - Furniture.needs_disassembly == False:
      요청과 무관하게 전체 개수 과금

  - 동일 furniture는 qty로 합산
  - amount = charged_qty * unit_amount
  - special_item_count = charged_qty 총합(실제 과금된 개수)
  """
  items: List[EstimateItem] = ctx.items or []
  if not items:
    return (0, 0, [])

  # furniture_id 있는 아이템만
  items = [it for it in items if it.furniture_id]
  if not items:
    return (0, 0, [])

  # 1) 전체 개수 집계
  total_counter = Counter(it.furniture_id for it in items)

  furniture_ids = set(total_counter.keys())

  # 2) 정책 룰 로딩 (SpecialItemFee 존재하는 furniture만 대상)
  rules_by_fid: Dict[int, SpecialItemFee] = {
    r.furniture_id: r
    for r in SpecialItemFee.objects.filter(is_active=True, furniture_id__in=furniture_ids)
  }
  if not rules_by_fid:
    return (0, 0, [])

  total_amount = 0
  special_item_count = 0
  lines: List[SpecialLine] = []

  # 3) furniture_id 단위로 계산
  for fid, qty_total in total_counter.items():
    rule = rules_by_fid.get(fid)
    if rule is None:
      continue  # SpecialItemFee 없는 건 제외

    # 해당 fid 아이템들
    group = [it for it in items if it.furniture_id == fid]
    any_item = group[0] if group else None
    furniture = getattr(any_item, "furniture", None)

    name_kr = furniture.name_kr if furniture else ""

    # Furniture 정책 플래그 (없으면 False 취급)
    furniture_needs_disassembly = bool(getattr(furniture, "needs_disassembly", False))

    if furniture_needs_disassembly:
      # 요청에서 needs_disassembly=True인 개수만 과금
      charged_qty = sum(1 for it in group if bool(getattr(it, "needs_disassembly", False)))
    else:
      # 요청과 무관하게 전체 과금
      charged_qty = int(qty_total)

    unit_amount = int(rule.unit_amount or 0)
    amount = int(charged_qty) * unit_amount

    lines.append(
      SpecialLine(
        furniture_id=fid,
        name_kr=name_kr,
        qty=int(qty_total),          # 전체 개수(응답용)
        unit_amount=unit_amount,
        amount=amount,               # 과금된 개수 기준 금액
        description=(
          f"{rule.description} 개당 {unit_amount}원"
        ),
      )
    )

    total_amount += amount
    special_item_count += int(charged_qty)

  lines.sort(key=lambda x: x.furniture_id)
  return (total_amount, special_item_count, lines)
