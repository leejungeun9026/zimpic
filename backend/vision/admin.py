from django.contrib import admin
from .models import VisionImage, VisionDetection


@admin.register(VisionImage)
class VisionImageAdmin(admin.ModelAdmin):
  list_display = ("id", "room_type", "image_file_name", "sort_order", "created_at")
  list_filter = ("room_type",)
  search_fields = ("image_file_name", "image_url")
  ordering = ("sort_order", "-id")


@admin.register(VisionDetection)
class VisionDetectionAdmin(admin.ModelAdmin):
  list_display = ("id", "vision_image_id", "yolo_id", "yolo_class", "furniture_id", "confidence", "created_at")
  list_filter = ("yolo_class",)
  search_fields = ("yolo_class",)
  autocomplete_fields = ("vision_image", "furniture")
  raw_id_fields = ("vision_image", "furniture")
  ordering = ("-id",)
