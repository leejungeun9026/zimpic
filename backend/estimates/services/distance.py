from __future__ import annotations

import os
import requests
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv
load_dotenv()


@dataclass(frozen=True)
class KakaoCoord:
    x: float  # longitude
    y: float  # latitude


class DistanceError(Exception):
    pass


def _get_kakao_rest_key() -> str:
    key = os.getenv("KAKAO_REST_API_KEY")
    if not key:
        raise DistanceError("KAKAO_REST_API_KEY is not set")
    return key


def geocode_address(address: str) -> Optional[KakaoCoord]:
    """
    도로명/지번 주소 -> 좌표(x,y)로 변환
    Kakao Local Address Search API 사용
    """
    key = _get_kakao_rest_key()
    url = "https://dapi.kakao.com/v2/local/search/address.json"
    headers = {"Authorization": f"KakaoAK {key}"}
    params = {"query": address}

    r = requests.get(url, headers=headers, params=params, timeout=5)
    r.raise_for_status()
    data = r.json()

    docs = data.get("documents", [])
    if not docs:
        return None

    # 가장 첫 결과 사용
    x = float(docs[0]["x"])
    y = float(docs[0]["y"])
    return KakaoCoord(x=x, y=y)


def directions_distance_m(origin: KakaoCoord, dest: KakaoCoord, priority: str = "DISTANCE") -> int:
    """
    출발/도착 좌표 -> 자동차 길찾기 거리(m)
    Kakao Mobility Directions API 사용
    priority="DISTANCE"면 최단거리 성향
    """
    key = _get_kakao_rest_key()
    url = "https://apis-navi.kakaomobility.com/v1/directions"
    headers = {
        "Authorization": f"KakaoAK {key}",
        "Content-Type": "application/json",
    }
    params = {
        "origin": f"{origin.x},{origin.y}",
        "destination": f"{dest.x},{dest.y}",
        "priority": priority,  # "DISTANCE" 또는 "TIME"
    }

    r = requests.get(url, headers=headers, params=params, timeout=5)
    r.raise_for_status()
    data = r.json()

    routes = data.get("routes", [])
    if not routes:
        raise DistanceError("No routes returned from directions API")

    # 문서에 전체 거리(distance, meter)가 존재 :contentReference[oaicite:6]{index=6}
    summary = routes[0].get("summary") or {}
    distance_m = summary.get("distance")

    if distance_m is None:
        # 일부 응답 형태 변화 대비(방어)
        raise DistanceError("distance field not found in directions response")

    return int(distance_m)


def calculate_distance_km(origin_address: str, dest_address: str) -> float:
    """
    주소 -> 거리(km)
    실패하면 DistanceError 발생(정책에 따라 0.0 반환으로 바꿔도 됨)
    """
    origin = geocode_address(origin_address)
    dest = geocode_address(dest_address)

    if origin is None:
        raise DistanceError(f"Cannot geocode origin_address: {origin_address}")
    if dest is None:
        raise DistanceError(f"Cannot geocode dest_address: {dest_address}")

    meters = directions_distance_m(origin, dest, priority="DISTANCE")
    return round(meters / 1000.0, 2)
