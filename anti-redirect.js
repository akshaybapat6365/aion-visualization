/**
 * Anti-redirect protection script
 * Prevents unwanted redirects to external domains
 */

(function() {
  'use strict';

  // Store original functions
  const originalLocation = Object.getOwnPropertyDescriptor(window, 'location');
  const originalOpen = window.open;
  const originalReplace = window.location.replace;
  const originalAssign = window.location.assign;
  const originalHref = Object.getOwnPropertyDescriptor(window.location, 'href');

  // Whitelist of allowed domains
  const allowedDomains = [
    'akshaybapat6365.github.io',
    'github.com',
    'localhost',
    '127.0.0.1'
  ];

  // Check if URL is allowed
  function isAllowedUrl(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      return allowedDomains.some(domain => 
        urlObj.hostname === domain || 
        urlObj.hostname.endsWith('.' + domain) ||
        urlObj.hostname === window.location.hostname
      );
    } catch {
      return true; // Allow relative URLs
    }
  }

  // Override location setter
  Object.defineProperty(window, 'location', {
    get: function() {
      return originalLocation.get.call(window);
    },
    set: function(value) {
      if (isAllowedUrl(value)) {
        originalLocation.set.call(window, value);
      } else {
        console.warn('Blocked redirect to:', value);
        console.trace('Redirect stack trace:');
      }
    },
    configurable: true
  });

  // Override location.href
  Object.defineProperty(window.location, 'href', {
    get: function() {
      return originalHref.get.call(window.location);
    },
    set: function(value) {
      if (isAllowedUrl(value)) {
        originalHref.set.call(window.location, value);
      } else {
        console.warn('Blocked redirect to:', value);
        console.trace('Redirect stack trace:');
      }
    },
    configurable: true
  });

  // Override location methods
  window.location.replace = function(url) {
    if (isAllowedUrl(url)) {
      originalReplace.call(window.location, url);
    } else {
      console.warn('Blocked redirect to:', url);
      console.trace('Redirect stack trace:');
    }
  };

  window.location.assign = function(url) {
    if (isAllowedUrl(url)) {
      originalAssign.call(window.location, url);
    } else {
      console.warn('Blocked redirect to:', url);
      console.trace('Redirect stack trace:');
    }
  };

  // Override window.open
  window.open = function(url, ...args) {
    if (!url || isAllowedUrl(url)) {
      return originalOpen.call(window, url, ...args);
    } else {
      console.warn('Blocked popup to:', url);
      console.trace('Popup stack trace:');
      return null;
    }
  };

  // Monitor for meta refresh tags
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.tagName === 'META' && node.httpEquiv === 'refresh') {
          const content = node.content;
          const urlMatch = content.match(/url=(.+)/i);
          if (urlMatch && !isAllowedUrl(urlMatch[1])) {
            node.remove();
            console.warn('Blocked meta refresh to:', urlMatch[1]);
          }
        }
      });
    });
  });

  observer.observe(document.head, { childList: true });

  // Log any blocked redirects
  console.log('🛡️ Anti-redirect protection active');
  
  // Also check for existing meta refresh on load
  document.addEventListener('DOMContentLoaded', function() {
    const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
    if (metaRefresh) {
      const content = metaRefresh.content;
      const urlMatch = content.match(/url=(.+)/i);
      if (urlMatch && !isAllowedUrl(urlMatch[1])) {
        metaRefresh.remove();
        console.warn('Removed existing meta refresh to:', urlMatch[1]);
      }
    }
  });

})();