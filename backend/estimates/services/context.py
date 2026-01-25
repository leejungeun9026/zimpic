from __future__ import annotations

from dataclasses import dataclass
from typing import List, Dict

from estimates.models import (
	Estimate,
	EstimateRoom,
	EstimateItem,
	EstimateTruckPlan,
)
from policy.models import Furniture


@dataclass
class EstimateContext:
	"""
	계산 단계에서 사용할 컨텍스트 객체
	"""
	estimate: Estimate

	# 이미 생성된 객체들 (DB 재조회 금지)
	rooms: List[EstimateRoom]
	items: List[EstimateItem]

	# packing 단계에서 만든 가구 스냅샷 참조용
	furniture_map: Dict[int, Furniture]

	# truck_plan 결과 (build_truck_plan에서 채움)
	truck_plans: List[EstimateTruckPlan]
