from django.contrib import admin
from .models import (
  Estimate,
  EstimateTruckPlan,
  EstimateRoom,
  EstimateItem,
  EstimatePrice,
  EstimatePriceSection,
  EstimatePriceLine,
)


@admin.register(Estimate)
class EstimateAdmin(admin.ModelAdmin):
  list_display = ("id", "move_type", "area", "distance_km", "recommended_ton", "special_item_count", "created_at")
  list_filter = ("move_type",)
  search_fields = ("origin_address", "dest_address")
  ordering = ("-id",)


@admin.register(EstimateTruckPlan)
class EstimateTruckPlanAdmin(admin.ModelAdmin):
  list_display = ("id", "estimate_id", "truck_type", "truck_count", "inner_w_cm", "inner_d_cm", "inner_h_cm")
  list_filter = ("truck_type",)
  raw_id_fields = ("estimate",)


@admin.register(EstimateRoom)
class EstimateRoomAdmin(admin.ModelAdmin):
  list_display = ("id", "estimate_id", "vision_image_id", "room_type", "sort_order", "created_at")
  list_filter = ("room_type",)
  raw_id_fields = ("estimate", "vision_image")
  ordering = ("estimate_id", "sort_order")


@admin.register(EstimateItem)
class EstimateItemAdmin(admin.ModelAdmin):
  list_display = ("id", "estimate_room_id", "item_id", "furniture_id", "w_cm", "d_cm", "h_cm", "needs_disassembly", "created_at")
  raw_id_fields = ("estimate_room", "furniture")
  search_fields = ("item_id",)


@admin.register(EstimatePrice)
class EstimatePriceAdmin(admin.ModelAdmin):
  list_display = ("id", "estimate_id", "total_amount", "calculated_at")
  raw_id_fields = ("estimate",)


@admin.register(EstimatePriceSection)
class EstimatePriceSectionAdmin(admin.ModelAdmin):
  list_display = ("id", "estimate_price_id", "key", "title", "amount")
  list_filter = ("key",)
  raw_id_fields = ("estimate_price",)


@admin.register(EstimatePriceLine)
class EstimatePriceLineAdmin(admin.ModelAdmin):
  list_display = ("id", "estimate_price_section_id", "scope", "furniture_id", "name_kr", "amount")
  list_filter = ("scope",)
  raw_id_fields = ("estimate_price_section", "furniture")
