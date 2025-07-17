/**
 * Initializes embed functionality on the form
 * @param {string} formId The form ID
 */
export function initFormEmbed(formId) {
  // Check if we're in an iframe and it's from an allowed domain
  if (window.self !== window.top) {
    // We're in an iframe
    // Set up a resize observer to adjust iframe height
    const resizeForm = () => {
      const height = document.body.scrollHeight;
      window.parent.postMessage(
        {
          type: 'resize',
          formId: formId,
          height: height,
        },
        '*'
      ); // Using * as a temporary measure; will be filtered by receiving side
    };

    // Create and observe body for size changes
    const resizeObserver = new ResizeObserver(() => {
      resizeForm();
    });

    resizeObserver.observe(document.body);

    // Also resize on window load and resize
    window.addEventListener('load', resizeForm);
    window.addEventListener('resize', resizeForm);
  }
}

/**
 * Checks if the current form is embedded
 * @returns {boolean} True if form is embedded
 */
export function isFormEmbedded() {
  return window.self !== window.top;
}
