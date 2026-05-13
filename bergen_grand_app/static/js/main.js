document.documentElement.classList.add("js-enabled");

const menuToggle = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("[data-menu]");
const siteHeader = document.querySelector("[data-header]");

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

const scrollToAnchorTarget = (targetEl, hash, smooth = true) => {
    const headerOffset = siteHeader ? siteHeader.getBoundingClientRect().height : 0;
    const visualGap = 10;
    const targetY = targetEl.getBoundingClientRect().top + window.scrollY - headerOffset - visualGap;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
        top: Math.max(0, targetY),
        behavior: smooth && !prefersReducedMotion ? "smooth" : "auto",
    });

    if (hash) {
        history.replaceState(null, "", hash);
    }
};

document.querySelectorAll('a[href*="#"]').forEach((link) => {
    if (!isSamePageAnchor(link)) {
        return;
    }

    link.addEventListener("click", (event) => {
        const targetEl = document.getElementById(link.hash.slice(1));
        if (!targetEl) {
            return;
        }

        event.preventDefault();
        scrollToAnchorTarget(targetEl, link.hash, true);
    });
});

window.addEventListener("load", () => {
    if (!window.location.hash || window.location.hash.length < 2) {
        return;
    }

    const targetEl = document.getElementById(window.location.hash.slice(1));
    if (targetEl) {
        window.requestAnimationFrame(() => scrollToAnchorTarget(targetEl, "", false));
    }
});

if (menuToggle && menu) {
    menuToggle.addEventListener("click", () => {
        const isOpen = menu.classList.toggle("is-open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        document.body.classList.toggle("menu-open", isOpen);
    });

    menu.addEventListener("click", (event) => {
        if (event.target instanceof HTMLAnchorElement) {
            menu.classList.remove("is-open");
            menuToggle.setAttribute("aria-expanded", "false");
            document.body.classList.remove("menu-open");
        }
    });
}

const navLinks = Array.from(document.querySelectorAll(".site-menu a[href^='#']:not(.nav-cta)"));
const navTargets = navLinks.map((link) => link.getAttribute("href"));
const observedSections = navTargets.length
    ? Array.from(
        document.querySelectorAll(
            navTargets
                .map((target) => `${target}, [data-nav-target="${target}"]`)
                .join(", "),
        ),
    )
    : [];

if ("IntersectionObserver" in window && navLinks.length && observedSections.length) {
    const setActiveLink = (target) => {
        navLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === target);
        });
    };

    const observer = new IntersectionObserver(
        (entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

            if (visible) {
                const target =
                    visible.target.getAttribute("data-nav-target") || `#${visible.target.id}`;
                setActiveLink(target);
            }
        },
        {
            rootMargin: "-30% 0px -55% 0px",
            threshold: [0.12, 0.32, 0.56],
        },
    );

    observedSections.forEach((section) => observer.observe(section));
}

const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
        const email = contactForm.querySelector("[data-contact-email]");
        const phone = contactForm.querySelector("[data-contact-phone]");

        if (!(email instanceof HTMLInputElement) || !(phone instanceof HTMLInputElement)) {
            return;
        }

        email.setCustomValidity("");
        phone.setCustomValidity("");

        if (!email.value.trim() && !phone.value.trim()) {
            event.preventDefault();
            email.setCustomValidity("Bitte geben Sie eine E-Mail-Adresse oder Telefonnummer an.");
            email.reportValidity();
        }
    });
}

const CONSENT_COOKIE = "bergen_grand_cookie_consent_v1";
const BANNER_CLOSED_COOKIE = "bergen_grand_cookie_banner_closed_v1";
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

const applyConsent = (consent, shouldPersist) => {
    if (shouldPersist) {
        persistConsent(consent);
    }
    setCheckboxes(consent);
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
