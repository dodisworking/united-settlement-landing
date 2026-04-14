/**
 * botGuard.js - Client-side behavioral tracking for bot detection
 * Tracks mouse movements, keystrokes, scroll, and slider interaction
 * Data is sent to the server with form submissions for validation
 */
(function() {
  'use strict';

  window.BotGuard = {
    mouseMovements: 0,
    keystrokes: 0,
    scrolled: false,
    sliderInteracted: false,
    touchEvents: 0,
    pageLoadTime: Date.now(),

    init: function() {
      document.addEventListener('mousemove', this._onMouse.bind(this), { passive: true });
      document.addEventListener('keydown', this._onKey.bind(this), { passive: true });
      document.addEventListener('scroll', this._onScroll.bind(this), { once: true, passive: true });
      document.addEventListener('touchstart', this._onTouch.bind(this), { passive: true });

      // Set page load time in hidden field
      var loadField = document.getElementById('pageLoadTime');
      if (loadField) {
        loadField.value = this.pageLoadTime.toString();
      }
    },

    _onMouse: function() {
      this.mouseMovements++;
    },

    _onKey: function() {
      this.keystrokes++;
    },

    _onScroll: function() {
      this.scrolled = true;
    },

    _onTouch: function() {
      this.touchEvents++;
    },

    markSliderInteracted: function() {
      this.sliderInteracted = true;
    },

    getData: function() {
      return {
        mouseMovements: this.mouseMovements,
        keystrokes: this.keystrokes,
        scrolled: this.scrolled,
        sliderInteracted: this.sliderInteracted,
        touchEvents: this.touchEvents,
        timeOnPage: Date.now() - this.pageLoadTime,
        pageLoadTime: this.pageLoadTime
      };
    },

    // Quick check: is this likely a bot?
    isLikelyBot: function() {
      var data = this.getData();
      // No mouse, no keyboard, no touch, no scroll in 3+ seconds = suspicious
      if (data.timeOnPage > 3000 &&
          data.mouseMovements === 0 &&
          data.keystrokes === 0 &&
          data.touchEvents === 0 &&
          !data.scrolled) {
        return true;
      }
      return false;
    }
  };

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { window.BotGuard.init(); });
  } else {
    window.BotGuard.init();
  }
})();
