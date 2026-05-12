from django.contrib import admin
from django.urls import path

from .views import index, robots_txt, sitemap_xml

urlpatterns = [
    path("", index, name="index"),
    path("robots.txt", robots_txt, name="robots_txt"),
    path("sitemap.xml", sitemap_xml, name="sitemap_xml"),
    path("admin/", admin.site.urls),
]
