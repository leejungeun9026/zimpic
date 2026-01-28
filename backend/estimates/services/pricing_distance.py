# estimates/services/pricing_distance.py
from __future__ import annotations

import math
from dataclasses import dataclass
from decimal import Decimal
from typing import List, Optional, Tuple

from policy.models import DistanceFeeRule


class DistancePricingError(Exception):
  """거리 요금 산출 중 정책 누락/데이터 오류"""


@dataclass
class DistanceLine:
  amount: int
  description: str


def _truck_type_rank(truck_type: str) -> float:
  mapping = {
      "1T": 1.0,
      "2_5T": 2.5,
      "5T": 5.0,
      "6T": 6.0,
      "7_5T": 7.5,
      "10T": 10.0,
  }
  return mapping.get(truck_type, 0.0)


def _normalize_truck_type_for_distance(main_truck_type: str) -> str:
  """
  7.5톤 이상이면 '최대 금액' 정책으로 계산
  - 우선순위 1) 7_5T 룰이 있으면 그걸로 고정
  - 우선순위 2) 없으면 활성 룰 중 per_unit_amount가 가장 큰 룰 사용
  """
  if _truck_type_rank(main_truck_type) >= 7.5:
      has_7_5 = DistanceFeeRule.objects.filter(truck_type="7_5T", is_active=True).exists()
      if has_7_5:
          return "7_5T"

      # fallback: 활성 룰 중 최대 금액
      max_rule = (
          DistanceFeeRule.objects.filter(is_active=True)
          .order_by("-per_unit_amount")
          .first()
      )
      if max_rule:
          return max_rule.truck_type

  return main_truck_type


def _to_float(v) -> float:
  if v is None:
    return 0.0
  if isinstance(v, (int, float)):
    return float(v)
  if isinstance(v, Decimal):
    return float(v)
  try:
    return float(v)
  except Exception:
    return 0.0


def calc_distance_cost(*, distance_km, truck_type: str) -> int:
  """
  - base_km 이하: 0원
  - base_km 초과: (초과분 / unit_km) 올림 × per_unit_amount
  """
  km = _to_float(distance_km)
  if km <= 0:
      return 0

  rule = (
      DistanceFeeRule.objects
      .filter(truck_type=truck_type, is_active=True)
      .first()
  )
  if rule is None:
      raise DistancePricingError(f"DistanceFeeRule not found (truck_type={truck_type})")

  base_km = float(rule.base_km)
  unit_km = float(rule.unit_km)
  per_unit = int(rule.per_unit_amount)

  if km <= base_km:
      return 0, f"기본 {int(base_km)}km 이내는 추가요금 없음"
  
  if unit_km <= 0:
      raise DistancePricingError(f"unit_km must be > 0 (truck_type={truck_type})")

  excess = km - base_km
  units = int(math.ceil(excess / unit_km))
  amount = units * per_unit

  description = (
    f"{km}km기준, {int(base_km)}km 초과 시 "
    f"{int(unit_km)}km당 {per_unit:,}원 추가 "
  )
  return amount, description