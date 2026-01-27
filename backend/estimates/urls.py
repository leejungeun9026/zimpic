from django.urls import path
from .views import EstimateCreateAPIView

urlpatterns = [
  path("", EstimateCreateAPIView.as_view()),
]
