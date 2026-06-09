(function () {
  const TARGET_UTM_SOURCE = 'googlebusinessprofile';

  const NEW_PHONE_DISPLAY = '+49 7221 9663988';
  const NEW_PHONE_TEL = '+4972219663988';

  const STORAGE_KEY = 'utm_source';
  const COOKIE_NAME = 'utm_source';

  function getUrlParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function getCookie(name) {
    const match = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/[$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)')
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setCookie(name, value, days) {
    const maxAge = days * 24 * 60 * 60;
    document.cookie =
      encodeURIComponent(name) + '=' + encodeURIComponent(value) +
      '; path=/; max-age=' + maxAge + '; SameSite=Lax';
  }

  function saveUtmSourceFromUrl() {
    const utmSource = getUrlParam('utm_source');

    if (!utmSource) {
      return;
    }

    const normalizedValue = utmSource.toLowerCase();

    try {
      localStorage.setItem(STORAGE_KEY, normalizedValue);
    } catch (e) {}

    setCookie(COOKIE_NAME, normalizedValue, 30);
  }

  function getStoredUtmSource() {
    const urlValue = getUrlParam('utm_source');

    if (urlValue) {
      return urlValue.toLowerCase();
    }

    try {
      const localStorageValue = localStorage.getItem(STORAGE_KEY);
      if (localStorageValue) {
        return localStorageValue.toLowerCase();
      }
    } catch (e) {}

    const cookieValue = getCookie(COOKIE_NAME);
    return cookieValue ? cookieValue.toLowerCase() : null;
  }

  function replacePhoneLinks() {
  const telLinks = document.querySelectorAll('a[href^="tel:"]');

  telLinks.forEach(function (link) {
    link.setAttribute('href', 'tel:' + NEW_PHONE_TEL);
  });
}

  function replacePhoneTextNodes() {
    const phoneRegex = /(\+49[\s\-()]*\d[\d\s\-()/]{7,}\d|0\d[\d\s\-()/]{7,}\d)/g;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          const parent = node.parentElement;

          if (!parent) {
            return NodeFilter.FILTER_REJECT;
          }

          const tagName = parent.tagName.toLowerCase();

          if (['script', 'style', 'noscript', 'textarea', 'input'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          if (!phoneRegex.test(node.nodeValue)) {
            phoneRegex.lastIndex = 0;
            return NodeFilter.FILTER_REJECT;
          }

          phoneRegex.lastIndex = 0;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    nodes.forEach(function (node) {
      node.nodeValue = node.nodeValue.replace(phoneRegex, NEW_PHONE_DISPLAY);
    });
  }

  saveUtmSourceFromUrl();

  if (getStoredUtmSource() !== TARGET_UTM_SOURCE) {
    return;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      replacePhoneLinks();
      replacePhoneTextNodes();
    });
  } else {
    replacePhoneLinks();
    replacePhoneTextNodes();
  }
})();
