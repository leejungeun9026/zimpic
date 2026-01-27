import os
from django.utils import timezone
from django.db import models


def vision_image_upload_to(instance, filename):
  """
  이미지 파일 저장 시 파일명 앞에 timestamp 추가
  """
  ts = timezone.now().strftime("%Y%m%d%H%M%S")
  name, ext = os.path.splitext(filename)
  return f"vision/{ts}_{name}{ext}"



class VisionImage(models.Model):
  """
	객체 탐지할 이미지
	"""
  id = models.BigAutoField(primary_key=True)

  room_type = models.CharField(max_length=30, blank=True)

  image = models.ImageField(upload_to=vision_image_upload_to, null=True, blank=True)
  image_file_name = models.CharField(max_length=255, blank=True)

  sort_order = models.IntegerField(default=0)
  created_at = models.DateTimeField(auto_now_add=True)

  class Meta:
    db_table = "vision_image"
    verbose_name = "객체 탐지 이미지"
    verbose_name_plural = "1. 객체 탐지 이미지 목록"
    indexes = [
      models.Index(fields=["room_type"]),
      models.Index(fields=["created_at"]),
    ]
    ordering = ["sort_order", "-id"]

  def __str__(self):
    return f"VisionImage#{self.id} ({self.room_type})"



class VisionDetection(models.Model):
  """
	YOLO 모델 객체 탐지 결과
	"""
  id = models.BigAutoField(primary_key=True)

  vision_image = models.ForeignKey(
    "vision.VisionImage",
    on_delete=models.CASCADE,
    related_name="detections",
    db_index=True,
  )

  yolo_id = models.IntegerField(null=True, blank=True)
  yolo_class = models.CharField(null=True, blank=True, max_length=50)

  furniture = models.ForeignKey(
    "policy.Furniture",
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="vision_detections",
    db_index=True,
  )

  confidence = models.DecimalField(null=True, blank=True, max_digits=6, decimal_places=5)

  # YOLO norm center_x, center_y, w, h (0~1)
  bbox_x = models.DecimalField(null=True, blank=True, max_digits=8, decimal_places=6)
  bbox_y = models.DecimalField(null=True, blank=True, max_digits=8, decimal_places=6)
  bbox_w = models.DecimalField(null=True, blank=True, max_digits=8, decimal_places=6)
  bbox_h = models.DecimalField(null=True, blank=True, max_digits=8, decimal_places=6)

  created_at = models.DateTimeField(auto_now_add=True)

  class Meta:
    db_table = "vision_detection"
    verbose_name = "객체 탐지 결과"
    verbose_name_plural = "2. 객체 탐지 결과 목록"
    indexes = [
      models.Index(fields=["vision_image"]),
      models.Index(fields=["furniture"]),
      models.Index(fields=["yolo_class"]),
      models.Index(fields=["-created_at"]),
    ]

  def __str__(self):
    return f"VisionDetection#{self.id} img={self.vision_image_id} cls={self.yolo_class}"
