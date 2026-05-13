import logging
from urllib.parse import parse_qs, unquote

from django.conf import settings
from django.core.mail import EmailMessage
from django.shortcuts import render
from django.urls import reverse

SITE_URL = "https://bergen-grand.com"
CONSENT_COOKIE_NAME = "bergen_grand_cookie_consent_v1"
BANNER_CLOSED_COOKIE_NAME = "bergen_grand_cookie_banner_closed_v1"
logger = logging.getLogger(__name__)


def _absolute_url(request, path):
    return request.build_absolute_uri(path)


def _page_context(request, path):
    context = _consent_context(request)
    context.update(
        {
            "canonical_url": _absolute_url(request, path),
            "og_image_url": _absolute_url(request, "/static/img/og.jpg"),
            "logo_url": _absolute_url(request, "/static/img/logo_small.png"),
        }
    )
    return context


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


def send_contact_request(values):
    reply_to = [values["email"]] if values["email"] else None
    body = "\n".join(
        [
            "Neue Anfrage von bergen-grand.com",
            "",
            f"Name: {values['name']}",
            f"E-Mail: {values['email'] or '-'}",
            f"Telefon: {values['phone'] or '-'}",
            "",
            "Nachricht:",
            values["message"],
        ]
    )

    email = EmailMessage(
        subject="Anfrage Privatschule GRAND",
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[settings.CONTACT_RECIPIENT_EMAIL],
        reply_to=reply_to or [],
    )
    email.send(fail_silently=False)
    logger.info("Contact request sent to %s", settings.CONTACT_RECIPIENT_EMAIL)
    return True


def index(request):
    context = _page_context(request, reverse("index"))

    if request.method == "POST":
        values = {
            "name": request.POST.get("name", "").strip(),
            "email": request.POST.get("email", "").strip(),
            "phone": request.POST.get("phone", "").strip(),
            "message": request.POST.get("message", "").strip(),
        }

        errors = []
        if not values["name"]:
            errors.append("Bitte geben Sie Ihren Namen an.")
        if not values["email"] and not values["phone"]:
            errors.append("Bitte geben Sie eine E-Mail-Adresse oder Telefonnummer an.")
        if not values["message"]:
            errors.append("Bitte schreiben Sie eine kurze Nachricht.")

        if errors:
            context["contact_errors"] = errors
            context["contact_values"] = values
        else:
            try:
                send_contact_request(values)
            except Exception:
                logger.exception("Contact request delivery failed")
                context["contact_errors"] = [
                    "Die Anfrage konnte gerade nicht gesendet werden. Bitte versuchen Sie es später erneut oder schreiben Sie uns direkt per E-Mail.",
                ]
                context["contact_values"] = values
            else:
                context["contact_success"] = True

    return render(request, "index.html", context)


def impressum(request):
    return render(request, "impressum.html", _page_context(request, reverse("impressum")))


def datenschutz(request):
    return render(request, "datenschutz.html", _page_context(request, reverse("datenschutz")))


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
            "lastmod": "2026-05-13",
            "changefreq": "weekly",
            "priority": "1.0",
        },
        {
            "loc": f"{SITE_URL}{reverse('impressum')}",
            "lastmod": "2026-05-13",
            "changefreq": "yearly",
            "priority": "0.3",
        },
        {
            "loc": f"{SITE_URL}{reverse('datenschutz')}",
            "lastmod": "2026-05-13",
            "changefreq": "yearly",
            "priority": "0.3",
        }
    ]
    return render(
        request,
        "sitemap.xml",
        {"items": items},
        content_type="application/xml; charset=utf-8",
    )
