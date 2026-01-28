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
  특수 옵션 비용 산출 (수량 반영)
  - needs_disassembly=True 인 아이템만 대상
  - 동일 furniture는 qty로 합산
  - amount = qty * unit_amount
  - special_item_count = "특수옵션 적용된 아이템 수(총 개수)" 로 반환
  """
  items: List[EstimateItem] = ctx.items or []
  if not items:
    return (0, 0, [])

  targets = [it for it in items if bool(getattr(it, "needs_disassembly", False))]
  if not targets:
    return (0, 0, [])

  # 1) furniture_id 기준 수량 집계
  # (EstimateItem에 furniture_id는 FK id로 항상 있음)
  fid_counter = Counter([it.furniture_id for it in targets if it.furniture_id])
  furniture_ids = set(fid_counter.keys())


  # 2) 정책 룰 맵 구성 (N+1 방지)
  rules_by_fid = {
    r.furniture_id: r
    for r in SpecialItemFee.objects.filter(is_active=True, furniture_id__in=furniture_ids)
  }

  total_amount = 0
  special_item_count = 0
  lines: List[SpecialLine] = []


  # 3) furniture_id 단위로 라인 생성 (qty * unit_amount)
  for fid, qty in fid_counter.items():
    rule = rules_by_fid.get(fid)

    if rule is None:
      raise SpecialPricingError(f"SpecialItemFee not found for furniture_id={fid}")

    unit_amount = int(rule.unit_amount or 0)
    amount = int(qty) * unit_amount

    any_item = next((it for it in targets if it.furniture_id == fid), None)
    name_kr = any_item.furniture.name_kr if any_item and any_item.furniture else ""

    lines.append(
      SpecialLine(
        furniture_id=fid,
        name_kr=name_kr,
        qty=int(qty),
        unit_amount=unit_amount,
        amount=amount,
        description=f"{rule.description} 개당 {unit_amount}원 추가",
      )
    )

    total_amount += amount
    special_item_count += int(qty)

  return (total_amount, special_item_count, lines)