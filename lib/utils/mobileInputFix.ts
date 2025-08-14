/**
 * Utility to prevent mobile zoom on input focus
 * This is specifically needed for iOS Safari and other mobile browsers
 * that automatically zoom when input font-size is less than 16px
 */

export function preventMobileZoomOnInputs() {
  if (typeof window === 'undefined') return;
  
  // Only apply on mobile devices
  if (window.innerWidth > 768) return;
  
  const applyFixToInput = (element: Element) => {
    const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (!input || !input.style) return;
    
    // Apply the 16px font size and other properties to prevent zoom
    input.style.fontSize = '16px';
    input.style.webkitTextSizeAdjust = '100%';
    input.style.webkitAppearance = 'none';
    input.style.appearance = 'none';
    input.style.minHeight = '44px';
    input.style.zoom = '1';
    input.style.transform = 'translateZ(0)'; // Force hardware acceleration
    
    // Add important flag via CSS text
    const importantStyles = `
      font-size: 16px !important;
      -webkit-text-size-adjust: 100% !important;
      -webkit-appearance: none !important;
      appearance: none !important;
      min-height: 44px !important;
      zoom: 1 !important;
      transform: translateZ(0) !important;
    `;
    
    // Try to set via style attribute if possible
    input.setAttribute('style', (input.getAttribute('style') || '') + '; ' + importantStyles);
  };
  
  // Find and fix all current inputs
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(applyFixToInput);
  
  // Also target specific AIOHA modal inputs
  const aiohaInputs = document.querySelectorAll(`
    #aioha-modal input,
    .aioha-modal input,
    .aioha-modal-content input,
    div[id="aioha-modal"] input,
    [role="dialog"] input,
    [data-aioha] input
  `);
  aiohaInputs.forEach(applyFixToInput);
  
  return applyFixToInput; // Return the function for use in event handlers
}

export function initMobileInputZoomPrevention() {
  if (typeof window === 'undefined') return;
  
  // Initial application
  const applyFixToInput = preventMobileZoomOnInputs();
  if (!applyFixToInput) return;
  
  // Set up mutation observer to catch dynamically added inputs
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      let shouldReapply = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if any new inputs were added
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (
                element.tagName === 'INPUT' ||
                element.tagName === 'TEXTAREA' ||
                element.tagName === 'SELECT' ||
                element.querySelector('input, textarea, select')
              ) {
                shouldReapply = true;
              }
            }
          });
        }
      });
      
      if (shouldReapply) {
        // Small delay to ensure the new elements are fully rendered
        setTimeout(preventMobileZoomOnInputs, 100);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
  
  // Fallback: reapply every few seconds as a safety net
  setInterval(preventMobileZoomOnInputs, 3000);
  
  // Also apply when window is resized (orientation change)
  window.addEventListener('resize', () => {
    setTimeout(preventMobileZoomOnInputs, 100);
  });
  
  // Apply when focus events occur on inputs
  document.addEventListener('focusin', (event) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      applyFixToInput(event.target);
    }
  });
}

// Auto-initialize when this module is imported
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileInputZoomPrevention);
  } else {
    initMobileInputZoomPrevention();
  }
}
