from django.shortcuts import render
from django.urls import reverse

SITE_URL = "https://bergen-grand.com"


def index(request):
    return render(request, "index.html")


def robots_txt(request):
    return render(
        request,
        "robots.txt",
        {"site_url": SITE_URL},
        content_type="text/plain; charset=utf-8",
    )


def sitemap_xml(request):
    items = [
        {
            "loc": f"{SITE_URL}{reverse('index')}",
            "lastmod": "2026-05-12",
            "changefreq": "weekly",
            "priority": "1.0",
        }
    ]
    return render(
        request,
        "sitemap.xml",
        {"items": items},
        content_type="application/xml; charset=utf-8",
    )
