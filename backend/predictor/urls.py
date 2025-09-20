from django.urls import path
from . import views

urlpatterns = [
    # The main page that shows the uploader UI
    path('', views.index, name='index'),
    # The API endpoint that our frontend will call to get a prediction
    path('predict/', views.predict, name='predict'),
]
