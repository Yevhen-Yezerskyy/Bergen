from django.contrib import admin
from django.urls import path

from .views import datenschutz, impressum, index, robots_txt, sitemap_xml

urlpatterns = [
    path("", index, name="index"),
    path("impressum/", impressum, name="impressum"),
    path("datenschutz/", datenschutz, name="datenschutz"),
    path("robots.txt", robots_txt, name="robots_txt"),
    path("sitemap.xml", sitemap_xml, name="sitemap_xml"),
    path("admin/", admin.site.urls),
]
