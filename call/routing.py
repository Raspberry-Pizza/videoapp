 # call/routing.py

from django.urls import re_path

from . import consumers
from .consumers import *

websocket_urlpatterns = [
    re_path(r'ws/call/', consumers.CallConsumer.as_asgi()),
]
