// accessibility.js - Accessibility utilities
(function() {
  window.MapAppUtils = window.MapAppUtils || {};

  /**
   * Accessibility Utilities
   *
   * FEATURES:
   * - Detect prefers-reduced-motion
   * - Manage focus for screen readers
   * - Announce dynamic updates to screen readers
   * - Keyboard navigation helpers
   *
   * TODO:
   * - [ ] Create live region for announcements
   * - [ ] Add focus trap for modals
   * - [ ] Handle keyboard shortcuts
   */
  window.MapAppUtils.Accessibility = {
    /**
     * Check if user prefers reduced motion
     * @returns {boolean}
     */
    prefersReducedMotion() {
      return window.matchMedia &&
             window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /**
     * Announce message to screen readers
     * @param {string} message - Text to announce
     * @param {string} priority - 'polite' or 'assertive'
     */
    announce(message, priority = 'polite') {
      console.log('TODO: Announce to screen reader:', message);

      // TODO: Create or reuse aria-live region
      // let liveRegion = document.getElementById('aria-live-region');
      // if (!liveRegion) {
      //   liveRegion = document.createElement('div');
      //   liveRegion.id = 'aria-live-region';
      //   liveRegion.setAttribute('aria-live', priority);
      //   liveRegion.setAttribute('aria-atomic', 'true');
      //   liveRegion.className = 'sr-only';
      //   document.body.appendChild(liveRegion);
      // }
      // liveRegion.textContent = message;
    },

    /**
     * Move focus to element (for screen reader context)
     * @param {HTMLElement} element - Element to focus
     * @param {boolean} scroll - Whether to scroll into view
     */
    focusElement(element, scroll = true) {
      if (!element) return;

      // Make element focusable if not already
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '-1');
      }

      element.focus();

      if (scroll) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    },

    /**
     * Check if element is keyboard-focusable
     * @param {HTMLElement} element
     * @returns {boolean}
     */
    isFocusable(element) {
      if (!element) return false;

      const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
      const isFocusableTag = focusableTags.includes(element.tagName);
      const hasTabIndex = element.hasAttribute('tabindex') &&
                         element.getAttribute('tabindex') !== '-1';

      return (isFocusableTag || hasTabIndex) &&
             !element.disabled &&
             element.offsetParent !== null; // Not hidden
    },

    /**
     * Get all focusable elements within container
     * @param {HTMLElement} container
     * @returns {Array<HTMLElement>}
     */
    getFocusableElements(container) {
      const selector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ].join(', ');

      return Array.from(container.querySelectorAll(selector))
        .filter(el => this.isFocusable(el));
    },

    /**
     * Create focus trap for modal dialogs
     * @param {HTMLElement} container
     * @returns {Function} Cleanup function
     */
    trapFocus(container) {
      console.log('TODO: Implement focus trap');

      // TODO: Trap focus within container
      // Store currently focused element
      // Listen for Tab keypresses
      // Cycle focus within focusable elements

      return () => {
        console.log('TODO: Release focus trap');
      };
    }
  };
})();
