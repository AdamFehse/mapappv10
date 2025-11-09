/**
 * bottom-sheet.js - Draggable bottom sheet controller
 * Handles drag/swipe gestures to expand/collapse bottom control panel
 */

export function initializeBottomSheet() {
  const sheet = document.querySelector('.bottom-sheet');
  const handle = document.querySelector('.bottom-sheet-handle');
  const overlay = document.querySelector('.bottom-sheet-overlay');

  if (!sheet || !handle) return;

  let isDragging = false;
  let startY = 0;
  let startHeight = 0;
  let currentY = 0;

  const DRAG_THRESHOLD = 50; // pixels to trigger expand/collapse
  const sheetHeight = sheet.clientHeight;
  const maxHeight = window.innerHeight * 0.7; // max 70% of viewport

  // Touch start - begin drag
  handle.addEventListener('touchstart', (e) => {
    isDragging = true;
    startY = e.touches[0].clientY;
    startHeight = sheet.offsetHeight;
    sheet.style.transition = 'none';
  });

  handle.addEventListener('mousedown', (e) => {
    isDragging = true;
    startY = e.clientY;
    startHeight = sheet.offsetHeight;
    sheet.style.transition = 'none';
  });

  // Touch/mouse move - drag
  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;

    currentY = e.touches[0].clientY - startY;
    const newHeight = Math.max(48, startHeight - currentY);

    if (newHeight <= maxHeight) {
      sheet.style.height = newHeight + 'px';
    }
  }, { passive: true });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    currentY = e.clientY - startY;
    const newHeight = Math.max(48, startHeight - currentY);

    if (newHeight <= maxHeight) {
      sheet.style.height = newHeight + 'px';
    }
  });

  // Touch/mouse end - snap to expanded or collapsed
  document.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;

    sheet.style.transition = 'height 300ms ease, transform 300ms ease';

    // Determine if we should expand or collapse based on drag distance
    if (currentY < -DRAG_THRESHOLD) {
      // Dragged up - expand
      sheet.classList.add('expanded');
      sheet.style.height = maxHeight + 'px';
    } else if (currentY > DRAG_THRESHOLD) {
      // Dragged down - collapse
      sheet.classList.remove('expanded');
      sheet.style.height = '100%';
    } else {
      // Not enough drag - return to previous state
      if (sheet.classList.contains('expanded')) {
        sheet.style.height = maxHeight + 'px';
      } else {
        sheet.style.height = '100%';
      }
    }
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;

    sheet.style.transition = 'height 300ms ease, transform 300ms ease';

    // Determine if we should expand or collapse based on drag distance
    if (currentY < -DRAG_THRESHOLD) {
      // Dragged up - expand
      sheet.classList.add('expanded');
      sheet.style.height = maxHeight + 'px';
    } else if (currentY > DRAG_THRESHOLD) {
      // Dragged down - collapse
      sheet.classList.remove('expanded');
      sheet.style.height = '100%';
    } else {
      // Not enough drag - return to previous state
      if (sheet.classList.contains('expanded')) {
        sheet.style.height = maxHeight + 'px';
      } else {
        sheet.style.height = '100%';
      }
    }
  });

  // Click handle to toggle expand/collapse
  handle.addEventListener('click', () => {
    sheet.style.transition = 'height 300ms ease, transform 300ms ease';

    if (sheet.classList.contains('expanded')) {
      sheet.classList.remove('expanded');
      sheet.style.height = '100%';
    } else {
      sheet.classList.add('expanded');
      sheet.style.height = maxHeight + 'px';
    }
  });

  // Click overlay to close
  if (overlay) {
    overlay.addEventListener('click', () => {
      sheet.classList.remove('expanded');
      sheet.style.transition = 'height 300ms ease, transform 300ms ease';
      sheet.style.height = '100%';
    });
  }

  // Handle window resize
  window.addEventListener('resize', () => {
    const newMaxHeight = window.innerHeight * 0.7;
    if (sheet.classList.contains('expanded')) {
      sheet.style.height = newMaxHeight + 'px';
    }
  });
}
