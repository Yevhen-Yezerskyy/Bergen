from django.shortcuts import render
from django.urls import reverse
from urllib.parse import parse_qs, unquote

import logging

from django.conf import settings
from django.core.mail import send_mail
from django.http import JsonResponse
from django.views.decorators.http import require_POST

SITE_URL = "https://bergen-immobilienservice.com"
CONSENT_COOKIE_NAME = "bergen_cookie_consent_v4"
BANNER_CLOSED_COOKIE_NAME = "bergen_cookie_banner_closed_v4"


def _consent_context(request):
    raw = request.COOKIES.get(CONSENT_COOKIE_NAME, "")
    decoded = unquote(raw)
    parsed = parse_qs(decoded, keep_blank_values=True)

    analytics = (parsed.get("analytics", ["0"])[0]) in ("1", "true", "True")
    external_media = (parsed.get("external_media", ["0"])[0]) in ("1", "true", "True")
    has_consent = "analytics" in parsed or "external_media" in parsed
    banner_closed = request.COOKIES.get(BANNER_CLOSED_COOKIE_NAME) == "1"

    return {
        "cookie_consent_analytics": analytics,
        "cookie_consent_external_media": external_media,
        "cookie_has_consent": has_consent,
        "cookie_banner_closed": banner_closed,
    }


def _render_page(request, template_name):
    return render(request, template_name, _consent_context(request))

def index(request):
    return _render_page(request, "index.html")


def impressum(request):
    return _render_page(request, "impressum.html")


def datenschutz(request):
    return _render_page(request, "datenschutz.html")


def erfahrung(request):
    return _render_page(request, "erfahrung.html")


def leistungsbereiche(request):
    return _render_page(request, "leistungsbereiche.html")


def robots_txt(request):
    return render(
        request,
        "robots.txt",
        {"site_url": SITE_URL},
        content_type="text/plain; charset=utf-8",
    )


def sitemap_xml(request):
    pages = [
        {"name": "index", "lastmod": "2026-04-30", "changefreq": "weekly", "priority": "1.0"},
        {"name": "leistungsbereiche", "lastmod": "2026-04-30", "changefreq": "weekly", "priority": "0.9"},
        {"name": "erfahrung", "lastmod": "2026-04-30", "changefreq": "monthly", "priority": "0.8"},
        {"name": "impressum", "lastmod": "2026-04-30", "changefreq": "yearly", "priority": "0.3"},
        {"name": "datenschutz", "lastmod": "2026-04-30", "changefreq": "yearly", "priority": "0.3"},
    ]
    items = [
        {
            "loc": f"{SITE_URL}{reverse(page['name'])}",
            "lastmod": page["lastmod"],
            "changefreq": page["changefreq"],
            "priority": page["priority"],
        }
        for page in pages
    ]
    return render(
        request,
        "sitemap.xml",
        {"items": items},
        content_type="application/xml; charset=utf-8",
    )

logger = logging.getLogger(__name__)


@require_POST
def contact_form_submit(request):
    name = request.POST.get("name", "").strip()
    phone = request.POST.get("phone", "").strip()
    message = request.POST.get("message", "").strip()

    if not name or not phone:
        return JsonResponse(
            {
                "ok": False,
                "message": "Bitte füllen Sie Name und Telefonnummer aus."
            },
            status=400
        )

    email_subject = "Neue Anfrage von bergen-immobilienservice.com"
    email_body = f"""Neue Anfrage über die Website:

Name: {name}
Telefon: {phone}

Nachricht:
{message if message else "-"}
"""

    try:
        send_mail(
            subject=email_subject,
            message=email_body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@bergen-immobilienservice.com"),
            recipient_list=["service@bergen-immobilienservice.com"],
            fail_silently=False,
        )
    except Exception:
        logger.exception("Contact form email sending failed")
        return JsonResponse(
            {
                "ok": False,
                "message": "Die Anfrage konnte nicht gesendet werden. Bitte rufen Sie uns direkt an."
            },
            status=500
        )

    return JsonResponse(
        {
            "ok": True,
            "message": "Vielen Dank. Ihre Anfrage wurde gesendet."
        }
    )