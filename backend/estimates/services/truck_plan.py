# estimates/services/truck_plan.py
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Tuple, Dict

from django.db import transaction

from estimates.models import Estimate, EstimateTruckPlan, EstimateItem
from policy.models import TruckSpec, BoxRule, Furniture


Q2 = Decimal("0.01")
Q1 = Decimal("0.1")

def d2(x: Decimal) -> Decimal:
  return x.quantize(Q2, rounding=ROUND_HALF_UP)

def p1(x: Decimal) -> Decimal:
  return x.quantize(Q1, rounding=ROUND_HALF_UP)

def to_decimal(x) -> Decimal:
  return Decimal(str(x))


@dataclass
class VirtualItem:
  w: Decimal
  d: Decimal
  h: Decimal
  stackable: bool
  can_stack_on_top: bool
  rotations: List[str]

  @property
  def volume_cbm(self) -> Decimal:
      return (self.w * self.d * self.h) / Decimal("1000000")


TRUCK_COMBINATIONS: List[List[str]] = [
  ["1T"],
  ["2_5T"],
  ["5T"],
  ["5T", "1T"],
  ["5T", "2_5T"],
  ["5T", "5T"],
  ["5T", "5T", "1T"],
  ["5T", "5T", "2_5T"],
]


@transaction.atomic
def build_truck_plan(
  *,
  estimate: Estimate,
  item_snapshots: List[EstimateItem],
  box_rule: BoxRule,
  box_furniture: Furniture,
  box_rotations: List[str],
  truck_specs: Dict[str, TruckSpec],
) -> List[EstimateTruckPlan]:
  """
  ✅ 계산 중 DB SELECT 0 목표 버전
  - EstimateItem을 다시 조회하지 않음
  - BoxRule/box/TruckSpec은 밖에서 주입
  - 반환: 생성된 EstimateTruckPlan 리스트
  """

  # 1) 기존 item_snapshots -> VirtualItem
  items: List[VirtualItem] = []
  for it in item_snapshots:
      rotations = (getattr(it, "allowed_rotations_json", None) or ["WDH"])
      items.append(
          VirtualItem(
              w=to_decimal(it.packed_w_cm),
              d=to_decimal(it.packed_d_cm),
              h=to_decimal(it.packed_h_cm),
              stackable=bool(it.stackable),
              can_stack_on_top=bool(it.can_stack_on_top),
              rotations=rotations,
          )
      )

  # 2) 박스 rule -> 박스 VirtualItem 추가
  box_count = int(box_rule.boxes_avg)
  estimate.boxes_count = box_count
  estimate.boxes_description = (
      f"{estimate.area}평 기준, 이사 박스(5호) 평균 {box_count}개를 기준으로 계산했어요."
  )

  bw = to_decimal(box_furniture.width_cm) + to_decimal(box_furniture.padding_cm) * 2
  bd = to_decimal(box_furniture.depth_cm) + to_decimal(box_furniture.padding_cm) * 2
  bh = to_decimal(box_furniture.height_cm) + to_decimal(box_furniture.padding_cm) * 2

  rot = box_rotations or ["WDH"]
  for _ in range(box_count):
      items.append(
          VirtualItem(
              w=bw, d=bd, h=bh,
              stackable=bool(box_furniture.stackable),
              can_stack_on_top=bool(box_furniture.can_stack_on_top),
              rotations=rot,
          )
      )

  # 3) total cbm
  total_cbm = d2(sum((i.volume_cbm for i in items), Decimal("0")))

  # 4) 후보 조합 탐색
  for combo in TRUCK_COMBINATIONS:
      specs = [truck_specs.get(t) for t in combo]
      if any(s is None for s in specs):
          continue

      total_capacity = d2(sum((to_decimal(s.cbm_geom) for s in specs), Decimal("0")))
      if total_capacity < total_cbm:
          continue

      remaining_to_assign = total_cbm
      per_truck_metrics: List[dict] = []

      for s in specs:
          cap = d2(to_decimal(s.cbm_geom))
          load = cap if remaining_to_assign >= cap else remaining_to_assign
          load = d2(load)
          remaining_to_assign = d2(remaining_to_assign - load)

          factor = Decimal("0.0") if cap == 0 else p1((load / cap) * Decimal("100"))

          per_truck_metrics.append({
              "capacity_cbm": cap,
              "load_cbm": load,
              "load_factor_pct": factor,
              "remaining_cbm": d2(cap - load),
          })

      # Estimate 필드 업데이트 (쓰기 1번)
      estimate.total_cbm = total_cbm
      estimate.truck_capacity_cbm = total_capacity
      estimate.remaining_cbm = d2(total_capacity - total_cbm)
      estimate.load_factor_pct = p1((total_cbm / total_capacity) * Decimal("100")) if total_capacity else Decimal("0.0")
      estimate.recommended_ton = to_decimal(_calc_recommended_ton(combo))

      estimate.save(update_fields=[
          "boxes_count",
          "boxes_description",
          "recommended_ton",
          "total_cbm",
          "truck_capacity_cbm",
          "load_factor_pct",
          "remaining_cbm",
      ])

      objs: List[EstimateTruckPlan] = []
      for truck_type, spec, m in zip(combo, specs, per_truck_metrics):
          objs.append(
              EstimateTruckPlan(
                  estimate=estimate,
                  truck_type=truck_type,
                  truck_count=1,
                  inner_w_cm=to_decimal(spec.inner_width_cm),
                  inner_d_cm=to_decimal(spec.inner_length_cm),
                  inner_h_cm=to_decimal(spec.inner_height_cm),
                  capacity_cbm=m["capacity_cbm"],
                  load_cbm=m["load_cbm"],
                  load_factor_pct=m["load_factor_pct"],
                  remaining_cbm=m["remaining_cbm"],
              )
          )
      EstimateTruckPlan.objects.bulk_create(objs)
      return objs

  raise ValueError("No suitable truck combination found")


def _calc_recommended_ton(combo: List[str]) -> Decimal:
  mapping = {"1T": Decimal("1.0"), "2_5T": Decimal("2.5"), "5T": Decimal("5.0")}
  total = Decimal("0.0")
  for t in combo:
      total += mapping.get(t, Decimal("0.0"))
  return total
