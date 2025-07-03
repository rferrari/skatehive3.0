// Buffer polyfill to suppress deprecation warnings in development
if (typeof global !== 'undefined' && typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Suppress Buffer deprecation warnings
  const originalEmitWarning = process.emitWarning;
  process.emitWarning = function(warning: any, options?: any) {
    // Suppress specific Buffer deprecation warnings
    if (
      (typeof warning === 'string' && warning.includes('Buffer() is deprecated')) ||
      (options && options.code === 'DEP0005')
    ) {
      return; // Skip this warning
    }
    return originalEmitWarning.call(this, warning, options);
  };
}

export {};
