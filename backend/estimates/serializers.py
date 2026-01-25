# estimates/serializers.py
from __future__ import annotations

from rest_framework import serializers

from .models import (
  Estimate,
  EstimateTruckPlan,
  EstimateRoom,
  EstimateItem,
  EstimatePrice,
  EstimatePriceSection,
  EstimatePriceLine,
)


# =========================================================
# 1) POST /api/estimates/  Request serializers (Input DTO)
# =========================================================

class EstimateItemInputSerializer(serializers.Serializer):
  furniture_id = serializers.IntegerField(required=False, allow_null=True)
  size_cm = serializers.DictField()
  needs_disassembly = serializers.BooleanField(default=False)

  def validate_size_cm(self, v):
    required = ["w_cm", "d_cm", "h_cm"]
    for k in required:
      if k not in v:
        raise serializers.ValidationError(f"size_cm must include {required}")

    out = {}
    for k in required:
      try:
        val = float(v[k])
      except Exception:
        raise serializers.ValidationError(f"size_cm.{k} must be a number")
      if val <= 0:
        raise serializers.ValidationError(f"size_cm.{k} must be > 0")
      out[k] = val
    return out


class EstimateRoomInputSerializer(serializers.Serializer):
  vision_image_id = serializers.IntegerField()
  sort_order = serializers.IntegerField()
  items = EstimateItemInputSerializer(many=True)

  def validate_items(self, items):
    if not items:
      raise serializers.ValidationError("items must not be empty")
    return items


class EstimateCreateSerializer(serializers.Serializer):
  move_type = serializers.ChoiceField(choices=Estimate.MoveType.choices)
  area = serializers.IntegerField(min_value=1)

  origin_address = serializers.CharField()
  origin_floor = serializers.IntegerField(min_value=0)
  origin_has_elevator = serializers.BooleanField()
  origin_use_ladder = serializers.BooleanField()

  dest_address = serializers.CharField()
  dest_floor = serializers.IntegerField(min_value=0)
  dest_has_elevator = serializers.BooleanField()
  dest_use_ladder = serializers.BooleanField()

  rooms = EstimateRoomInputSerializer(many=True)

  def validate_rooms(self, rooms):
    if not rooms:
      raise serializers.ValidationError("rooms must not be empty")

    # UNIQUE(estimate, sort_order) 방어: 요청 내 sort_order 중복 방지
    orders = [r["sort_order"] for r in rooms]
    if len(orders) != len(set(orders)):
      raise serializers.ValidationError("rooms.sort_order must be unique")

    return rooms


# =========================================================
# 2) POST /api/estimates/  Response serializers (Output DTO)
# =========================================================

class EstimateTruckPlanResponseSerializer(serializers.ModelSerializer):
  class Meta:
    model = EstimateTruckPlan
    fields = ["truck_type", "truck_count", "inner_w_cm", "inner_d_cm", "inner_h_cm"]


class EstimateItemResponseSerializer(serializers.ModelSerializer):
  furniture_id = serializers.IntegerField( allow_null=True)
  name_kr = serializers.SerializerMethodField()
  allowed_rotations = serializers.ListField(source="allowed_rotations_json")

  class Meta:
    model = EstimateItem
    fields = [
      "item_id",
      "furniture_id",
      "name_kr",
      "w_cm", "d_cm", "h_cm",
      "padding_cm",
      "packed_w_cm", "packed_d_cm", "packed_h_cm",
      "stackable", "can_stack_on_top",
      "allowed_rotations",
      "needs_disassembly",
    ]

  def get_name_kr(self, obj):
    # policy.Furniture에 name_kr이 있다고 가정
    if obj.furniture and hasattr(obj.furniture, "name_kr"):
      return obj.furniture.name_kr
    return None


class EstimateRoomResponseSerializer(serializers.ModelSerializer):
  vision_image_id = serializers.IntegerField(allow_null=True)
  items = EstimateItemResponseSerializer(many=True)

  class Meta:
    model = EstimateRoom
    fields = ["vision_image_id", "room_type", "image_url", "sort_order", "items"]


class EstimatePriceLineResponseSerializer(serializers.ModelSerializer):
  furniture_id = serializers.IntegerField(allow_null=True)

  class Meta:
    model = EstimatePriceLine
    fields = ["scope", "furniture_id", "name_kr", "amount", "description"]


class EstimatePriceSectionResponseSerializer(serializers.ModelSerializer):
  lines = EstimatePriceLineResponseSerializer(many=True)

  class Meta:
    model = EstimatePriceSection
    fields = ["key", "title", "amount", "description", "lines"]


class EstimatePriceResponseSerializer(serializers.ModelSerializer):
  sections = EstimatePriceSectionResponseSerializer(many=True)

  class Meta:
    model = EstimatePrice
    fields = ["total_amount", "sections"]


class EstimateSummaryResponseSerializer(serializers.ModelSerializer):
  truck_plan = EstimateTruckPlanResponseSerializer(source="truck_plans",many=True)

  class Meta:
    model = Estimate
    fields = [
      "move_type",
      "area",
      "origin_address", "origin_floor", "origin_has_elevator", "origin_use_ladder",
      "dest_address", "dest_floor", "dest_has_elevator", "dest_use_ladder",
      "distance_km",
      "recommended_ton",
      "special_item_count",
      "truck_plan",
    ]


class EstimateResponseSerializer(serializers.ModelSerializer):
  estimate_id = serializers.IntegerField(source="id",read_only=True)
  summary = EstimateSummaryResponseSerializer(source="*", read_only=True)
  rooms = EstimateRoomResponseSerializer(many=True, read_only=True)
  pricing = EstimatePriceResponseSerializer(source="price", read_only=True)

  class Meta:
    model = Estimate
    fields = ["estimate_id", "summary", "rooms", "pricing"]
