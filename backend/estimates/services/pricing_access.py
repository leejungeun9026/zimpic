from __future__ import annotations

from dataclasses import dataclass
from typing import List, Literal, Optional, Tuple

from policy.models import LadderFeeRule, StairsFeeRule

Scope = Literal["ORIGIN", "DEST"]
SectionKey = Literal["LADDER", "STAIRS"]

class AccessPricingError(Exception):
  pass

@dataclass
class AccessLine:
  scope : Scope
  amount: int
  description: str = ""
  name_kr: Optional[str] = None

_TRUCK_RANK = {"1T": 1.0, "2_5T": 2.5, "5T": 5.0, "6T": 6.0, "7_5T": 7.5, "10T": 10.0}

def _ton_label(truck_type: str) -> str:
  # "7_5T" -> "7.5톤", "5T" -> "5톤", "10T" -> "10톤"
  if truck_type.endswith("T"):
    core = truck_type[:-1]          # "7_5"
    core = core.replace("_", ".")   # "7.5"
    return f"{core}톤"
  return truck_type


def _scope_label(scope: Scope) -> str:
  return "출발지" if scope == "ORIGIN" else "도착지"


def _normalize_ladder_group(main_truck_type: str) -> str:
  """
  사다리차 요금표는 5T 이상만 존재, 5T 미만은 5T 기준으로 조회
  """
  ton = _TRUCK_RANK.get(main_truck_type)
  if ton is None:
    # 모르는 타입이면 5T로 처리
    return "5T"
  return "5T" if ton < 5.0 else main_truck_type



def calc_access_cost(
  *,
  scope: Literal["ORIGIN", "DEST"],
  floor: int,
  has_elevator: bool,
  use_ladder: bool,
  main_truck_type: str,
) -> Tuple[SectionKey, int, List[AccessLine]]:
  """
  접근비용 계산 (한쪽 기준: 출발지 or 도착지)
  반환: (section_key, amount, lines)

  우선순위:
    Case 1) 사다리 사용(use_ladder=True) -> ladder_fee_rule (엘베 여부 무관)
    Case 2) 사다리 미사용 + 엘리베이터 가능 -> 0
    Case 3) 사다리 미사용 + 엘리베이터 불가 -> stairs_fee_rule
  """ 

  # 톤수 가져오기
  ladder_group = _normalize_ladder_group(main_truck_type)
  ton = _ton_label(ladder_group)
  label = _scope_label(scope)
  
  # -----------------------------
  # Case 1) 사다리 사용
  # -----------------------------
  # - ladder_truck_group(톤수) + floor_from~floor_to 구간으로 base_amount 조회
  # - 5톤 미만이면 5T 그룹으로 조회
  # - floor <= 1 이면 사다리차 미사용으로 보고 0원 반환
  # - floor > 24 이면 해당 톤수에서 가장 높은 구간(최대 floor_to)의 금액을 사용하고 코멘트 추가

  if use_ladder:
    # 1층 사다리차 미적용, 0원 반환
    if floor <= 1:
      return "LADDER", 0, [
        AccessLine(
          scope=scope,
          amount=0,
          description="1층은 사다리차 미사용",
        )
      ]

    # 기본 조회
    rule = (
      LadderFeeRule.objects
      .filter(
        ladder_truck_group=ladder_group,
        floor_from__lte=floor,
        floor_to__gte=floor,
        is_active=True
      )
      .order_by("floor_from")
      .first()
    )

    # 사다리차 DB보다 높은 층수(24층 이상) 처리
    extra_comment = ""
    if rule is None:
      top_rule = (
        LadderFeeRule.objects
        .filter(
          ladder_truck_group=ladder_group,
          is_active=True
        )
        .order_by("-floor_to")
        .first()
      )
      if top_rule is None:
        raise AccessPricingError(f"LadderFeeRule not found (group={ladder_group})")

      rule = top_rule
      extra_comment = (
        f" ({rule.floor_to}층 이상은 별도 협의가 필요해요. "
        f"현재 견적은 최고층수 기준으로 계산했어요.)"
      )


    amt = int(rule.base_amount)
    description = (
      f"{ton} 기준 {label} {floor}층 사다리차 비용"
      f"{extra_comment}"
    )
        
    return "LADDER", amt, [
      AccessLine(
        scope=scope,
        amount=amt,
        description=description
      )
    ]

  # -----------------------------
  # Case 2) 사다리 미사용 + 엘리베이터 가능 => 0
  # -----------------------------
  if has_elevator:
    return "STAIRS", 0, []



  # -----------------------------
  # Case 3) 사다리 미사용 + 엘리베이터 불가 => 계단 비용
  # -----------------------------
  if floor <= 1:
    return "STAIRS", 0, []

  rule = (
    StairsFeeRule.objects
    .filter(
      floor_from__lte=floor, 
      floor_to__gte=floor, 
      is_active=True
    )
    .order_by("floor_from")
    .first()
  )

  if rule is None:
    raise AccessPricingError(f"StairsFeeRule not found (floor={floor})")

  # 층당 금액 계산
  per_floor = int(rule.per_floor_amount)
  amt = (floor - 1) * per_floor

  return "STAIRS", amt, [
    AccessLine(
      scope=scope,
      amount=amt,
      description=f"{ton} 기준 {label} {floor}층 계단 비용",
    )
  ]
