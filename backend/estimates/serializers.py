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


class EstimateSerializer(serializers.ModelSerializer):
  class Meta:
    model = Estimate
    fields = "__all__"


class EstimateTruckPlanSerializer(serializers.ModelSerializer):
  class Meta:
    model = EstimateTruckPlan
    fields = "__all__"


class EstimateRoomSerializer(serializers.ModelSerializer):
  class Meta:
    model = EstimateRoom
    fields = "__all__"


class EstimateItemSerializer(serializers.ModelSerializer):
  class Meta:
    model = EstimateItem
    fields = "__all__"


class EstimatePriceSerializer(serializers.ModelSerializer):
  class Meta:
    model = EstimatePrice
    fields = "__all__"


class EstimatePriceSectionSerializer(serializers.ModelSerializer):
  class Meta:
    model = EstimatePriceSection
    fields = "__all__"


class EstimatePriceLineSerializer(serializers.ModelSerializer):
  class Meta:
    model = EstimatePriceLine
    fields = "__all__"
