from django.urls import path
from .views import VisionUploadAPIView

urlpatterns = [
  path("vision/", VisionUploadAPIView.as_view()),
]
