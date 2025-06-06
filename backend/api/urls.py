from django.urls import path
from .views import PDFProcessView, PDFDownloadView

urlpatterns = [
    path('process/', PDFProcessView.as_view(), name='pdf-process'),
    path('download/<str:filename>/', PDFDownloadView.as_view(), name='pdf-download'),
]
