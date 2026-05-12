document.addEventListener("DOMContentLoaded", () => {
    const html = document.documentElement;
    const siteHeader = document.querySelector(".site-header");
    html.classList.add("js-enabled");

    const linksByTarget = {
        home: Array.from(document.querySelectorAll('[data-nav-target="home"]')),
        leistungsbereiche: Array.from(document.querySelectorAll('[data-nav-target="leistungsbereiche"]')),
        "uber-uns": Array.from(document.querySelectorAll('[data-nav-target="uber-uns"]')),
        erfahrung: Array.from(document.querySelectorAll('[data-nav-target="erfahrung"]')),
        kontakt: Array.from(document.querySelectorAll('[data-nav-target="kontakt"]')),
    };

    const clearActive = () => {
        Object.values(linksByTarget).forEach((links) => {
            links.forEach((link) => link.classList.remove("is-active"));
        });
    };

    const setActive = (key) => {
        clearActive();
        if (!linksByTarget[key]) {
            return;
        }
        linksByTarget[key].forEach((link) => link.classList.add("is-active"));
    };

    const onIndexPage = document.getElementById("uber-uns") && document.getElementById("kontakt");

    const easeInOutCubic = (t) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const smoothScrollTo = (targetY, durationMs) => {
        const startY = window.scrollY;
        const distance = targetY - startY;
        const startTime = performance.now();

        const tick = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            const eased = easeInOutCubic(progress);
            window.scrollTo(0, startY + distance * eased);
            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        };

        requestAnimationFrame(tick);
    };

    const normalizePathname = (pathname) => {
        if (!pathname || pathname === "/") {
            return "/";
        }
        return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
    };

    const isSamePageAnchor = (link) => {
        if (!link.hash) {
            return false;
        }
        const current = new URL(window.location.href);
        const target = new URL(link.href, window.location.origin);
        return (
            current.origin === target.origin &&
            normalizePathname(current.pathname) === normalizePathname(target.pathname)
        );
    };

    document.querySelectorAll('a[href*="#"]').forEach((link) => {
        if (!isSamePageAnchor(link)) {
            return;
        }
        link.addEventListener("click", (event) => {
            const targetId = link.hash.replace("#", "");
            const targetEl = document.getElementById(targetId);
            if (!targetEl) {
                return;
            }
            event.preventDefault();
            const headerOffset = siteHeader ? siteHeader.getBoundingClientRect().height : 0;
            const visualGap = 10;
            const targetY = targetEl.getBoundingClientRect().top + window.scrollY - headerOffset - visualGap;
            smoothScrollTo(targetY, 720);
            history.replaceState(null, "", `#${targetId}`);
        });
    });

    const alignInitialHashTarget = () => {
        const hash = window.location.hash;
        if (!hash || hash.length < 2) {
            return;
        }
        const targetId = hash.slice(1);
        const targetEl = document.getElementById(targetId);
        if (!targetEl) {
            return;
        }
        const headerOffset = siteHeader ? siteHeader.getBoundingClientRect().height : 0;
        const visualGap = 10;
        const targetY = targetEl.getBoundingClientRect().top + window.scrollY - headerOffset - visualGap;
        window.scrollTo(0, Math.max(0, targetY));
    };

    const syncAnchorScrollMargins = () => {
        const headerOffset = siteHeader ? siteHeader.getBoundingClientRect().height : 0;
        const dynamicOffset = Math.max(0, Math.round(headerOffset + 10));
        const anchorTargets = [
            "bau",
            "sanierung",
            "immobilienverwaltung",
            "gebaeudeservice",
            "neubau",
            "uber-uns",
            "kontakt",
        ];
        anchorTargets.forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                el.style.scrollMarginTop = `${dynamicOffset}px`;
            }
        });
    };

    // Reveal-on-scroll animation intentionally disabled to avoid hidden content states.

    let headerIsCompact = false;
    let lastScrollY = window.scrollY;
    const COMPACT_ON_SCROLL = 90;
    const COMPACT_OFF_SCROLL = 4;

    const updateHeaderState = () => {
        if (!siteHeader) {
            return;
        }
        const y = window.scrollY;
        const scrollingDown = y >= lastScrollY;

        if (!headerIsCompact && scrollingDown && y >= COMPACT_ON_SCROLL) {
            siteHeader.classList.add("is-compact");
            headerIsCompact = true;
            lastScrollY = y;
            return;
        }
        if (headerIsCompact && y <= COMPACT_OFF_SCROLL) {
            siteHeader.classList.remove("is-compact");
            headerIsCompact = false;
        }
        lastScrollY = y;
    };

    updateHeaderState();
    window.addEventListener("scroll", updateHeaderState, { passive: true });
    window.addEventListener("resize", updateHeaderState);

    const CONSENT_COOKIE = "bergen_cookie_consent_v4";
    const BANNER_CLOSED_COOKIE = "bergen_cookie_banner_closed_v4";
    const COOKIE_MAX_AGE_SEC = 31536000;
    const consentBanner = document.querySelector("[data-cookie-banner]");
    const consentOpeners = Array.from(document.querySelectorAll("[data-cookie-open-settings]"));
    const consentToggleButtons = Array.from(document.querySelectorAll("[data-cookie-toggle-settings]"));
    const consentCloseButtons = Array.from(document.querySelectorAll("[data-cookie-close-banner]"));
    const settingsPanel = document.querySelector("[data-cookie-settings-panel]");
    const acceptAllButtons = Array.from(document.querySelectorAll("[data-cookie-accept-all]"));
    const acceptNecessaryButtons = Array.from(document.querySelectorAll("[data-cookie-accept-necessary]"));
    const saveSelectionButton = document.querySelector("[data-cookie-save-selection]");
    const analyticsCheckbox = document.querySelector('[data-cookie-setting="analytics"]');
    const externalMediaCheckbox = document.querySelector('[data-cookie-setting="external_media"]');
    const mapContainer = document.querySelector("[data-map-container]");
    const mapSrc = mapContainer ? mapContainer.getAttribute("data-map-src") : "";

    const defaultConsent = {
        analytics: false,
        external_media: false,
    };

    const getCookie = (name) => {
        const prefix = `${name}=`;
        const parts = document.cookie ? document.cookie.split(";") : [];
        for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed.startsWith(prefix)) {
                return decodeURIComponent(trimmed.slice(prefix.length));
            }
        }
        return "";
    };

    const setCookie = (name, value, maxAgeSec) => {
        document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax`;
    };

    const readConsentFromCookie = () => {
        const raw = getCookie(CONSENT_COOKIE);
        if (!raw) {
            return null;
        }
        const params = new URLSearchParams(raw);
        if (!params.has("analytics") && !params.has("external_media")) {
            return null;
        }
        return {
            analytics: params.get("analytics") === "1",
            external_media: params.get("external_media") === "1",
        };
    };

    const readConsentFromServer = () => {
        const hasConsent = document.body.dataset.cookieHasConsent === "1";
        if (!hasConsent) {
            return null;
        }
        return {
            analytics: document.body.dataset.cookieConsentAnalytics === "1",
            external_media: document.body.dataset.cookieConsentExternalMedia === "1",
        };
    };

    const isBannerClosed = () => {
        const fromCookie = getCookie(BANNER_CLOSED_COOKIE);
        if (fromCookie) {
            return fromCookie === "1";
        }
        return document.body.dataset.cookieBannerClosed === "1";
    };

    const persistConsent = (consent) => {
        const value = `analytics=${consent.analytics ? "1" : "0"}&external_media=${consent.external_media ? "1" : "0"}`;
        setCookie(CONSENT_COOKIE, value, COOKIE_MAX_AGE_SEC);
        setCookie(BANNER_CLOSED_COOKIE, "1", COOKIE_MAX_AGE_SEC);
    };

    const persistBannerClosed = () => {
        setCookie(BANNER_CLOSED_COOKIE, "1", COOKIE_MAX_AGE_SEC);
    };

    const showBanner = (show) => {
        if (!consentBanner) {
            return;
        }
        consentBanner.hidden = !show;
    };

    const setPanelOpen = (open) => {
        if (!settingsPanel) {
            return;
        }
        settingsPanel.hidden = !open;
        consentToggleButtons.forEach((button) => {
            button.setAttribute("aria-expanded", open ? "true" : "false");
        });
    };

    const togglePanel = () => {
        if (!settingsPanel) {
            return;
        }
        setPanelOpen(settingsPanel.hidden);
    };

    const setCheckboxes = (consent) => {
        if (analyticsCheckbox) {
            analyticsCheckbox.checked = Boolean(consent.analytics);
        }
        if (externalMediaCheckbox) {
            externalMediaCheckbox.checked = Boolean(consent.external_media);
        }
    };

    const renderMapState = (allowed) => {
        if (!mapContainer) {
            return;
        }
        if (allowed) {
            mapContainer.innerHTML = `
                <iframe
                    class="map-consent-frame"
                    src="${mapSrc || ""}"
                    title="Standort Bergen Immobilienservice GmbH in Baden-Baden auf Google Maps"
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    allowfullscreen
                ></iframe>
            `;
            return;
        }
        mapContainer.innerHTML = `
            <div class="map-consent-placeholder">
                <p class="map-consent-title">Google Maps ist deaktiviert.</p>
                <p class="map-consent-text">Für die Anzeige der Karte benötigen wir Ihre Einwilligung zu externen Medien.</p>
                <div class="map-consent-actions">
                    <button type="button" class="cookie-btn cookie-btn-primary" data-map-accept>Karte laden</button>
                    <button type="button" class="cookie-btn cookie-btn-ghost" data-map-open-settings>Cookie-Einstellungen</button>
                </div>
            </div>
        `;
    };

    const applyConsent = (consent, shouldPersist) => {
        if (shouldPersist) {
            persistConsent(consent);
        }
        setCheckboxes(consent);
        renderMapState(Boolean(consent.external_media));
    };

    consentOpeners.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            const current = readConsentFromCookie() || readConsentFromServer() || defaultConsent;
            setCheckboxes(current);
            showBanner(true);
            setPanelOpen(true);
        });
    });

    consentToggleButtons.forEach((button) => {
        button.addEventListener("click", () => {
            togglePanel();
        });
    });

    consentCloseButtons.forEach((button) => {
        button.addEventListener("click", () => {
            persistBannerClosed();
            showBanner(false);
        });
    });

    acceptAllButtons.forEach((button) => {
        button.addEventListener("click", () => {
            applyConsent({ analytics: true, external_media: true }, true);
            showBanner(false);
        });
    });

    acceptNecessaryButtons.forEach((button) => {
        button.addEventListener("click", () => {
            applyConsent({ analytics: false, external_media: false }, true);
            showBanner(false);
        });
    });

    if (saveSelectionButton) {
        saveSelectionButton.addEventListener("click", () => {
            const selection = {
                analytics: Boolean(analyticsCheckbox && analyticsCheckbox.checked),
                external_media: Boolean(externalMediaCheckbox && externalMediaCheckbox.checked),
            };
            applyConsent(selection, true);
            showBanner(false);
            setPanelOpen(false);
        });
    }

    if (mapContainer) {
        mapContainer.addEventListener("click", (event) => {
            const acceptBtn = event.target.closest("[data-map-accept]");
            if (acceptBtn) {
                renderMapState(true);
                return;
            }
            const settingsBtn = event.target.closest("[data-map-open-settings]");
            if (settingsBtn) {
                const current = readConsentFromCookie() || readConsentFromServer() || defaultConsent;
                setCheckboxes(current);
                showBanner(true);
                setPanelOpen(true);
            }
        });
    }

    const initialConsent = readConsentFromCookie() || readConsentFromServer();
    if (initialConsent) {
        applyConsent(initialConsent, false);
    } else {
        applyConsent(defaultConsent, false);
    }

    if (consentBanner) {
        const shouldShowBanner = !initialConsent && !isBannerClosed();
        showBanner(shouldShowBanner);
        setPanelOpen(false);
    }

    syncAnchorScrollMargins();
    window.requestAnimationFrame(alignInitialHashTarget);

    if (!onIndexPage) {
        if (window.location.pathname.includes("/leistungsbereiche/")) {
            setActive("leistungsbereiche");
        } else if (window.location.pathname.includes("/erfahrung/")) {
            setActive("erfahrung");
        }
        window.addEventListener("resize", syncAnchorScrollMargins);
        return;
    }

    const sectionOrder = [
        { key: "kontakt", el: document.getElementById("kontakt") },
        { key: "uber-uns", el: document.getElementById("uber-uns") },
    ];

    const updateActiveByScroll = () => {
        const y = window.scrollY;
        const viewportMiddle = y + window.innerHeight * 0.42;
        const kontaktTop = sectionOrder[0].el.offsetTop;

        if (viewportMiddle >= kontaktTop) {
            setActive("kontakt");
            return;
        }

        const uberTop = sectionOrder[1].el.offsetTop;
        if (viewportMiddle >= uberTop) {
            setActive("uber-uns");
            return;
        }

        setActive("home");
    };

    updateActiveByScroll();
    window.addEventListener("scroll", updateActiveByScroll, { passive: true });
    window.addEventListener("resize", () => {
        syncAnchorScrollMargins();
        updateActiveByScroll();
    });
});
