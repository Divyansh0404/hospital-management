/**
 * Browser Extension Error Handler
 * Suppresses known extension-related console errors that don't affect our application
 */

// Suppress extension-related errors in development
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // List of known extension-related error patterns to suppress
  const extensionErrorPatterns = [
    /chrome-extension:\/\/.*\/utils\.js/,
    /chrome-extension:\/\/.*\/extensionState\.js/,
    /chrome-extension:\/\/.*\/heuristicsRedefinitions\.js/,
    /ERR_FILE_NOT_FOUND.*chrome-extension/,
    /net::ERR_FILE_NOT_FOUND.*chrome-extension/
  ];
  
  const isExtensionError = (message: any): boolean => {
    if (typeof message !== 'string') {
      message = String(message);
    }
    return extensionErrorPatterns.some(pattern => pattern.test(message));
  };
  
  // Override console.error to filter extension errors
  console.error = (...args) => {
    const message = args.join(' ');
    if (!isExtensionError(message)) {
      originalConsoleError.apply(console, args);
    }
  };
  
  // Override console.warn for extension warnings
  console.warn = (...args) => {
    const message = args.join(' ');
    if (!isExtensionError(message)) {
      originalConsoleWarn.apply(console, args);
    }
  };
  
  // Add window error handler for uncaught extension errors
  window.addEventListener('error', (event) => {
    if (isExtensionError(event.message || event.error?.message || '')) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });
  
  // Add unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    if (isExtensionError(event.reason?.message || String(event.reason) || '')) {
      event.preventDefault();
      return false;
    }
  });
  
  // Log that the error handler is active (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('🛡️ Extension error suppression active');
  }
}

export default function initializeErrorSuppression() {
  // This function can be called to ensure error suppression is initialized
  return true;
}