/**
 * Suppress specific React warnings in development
 * 
 * ISSUE: RainbowKit's dependency 'cuer' (QR code library) passes an invalid 
 * `errorCorrection` prop to a DOM element, causing React warnings.
 * 
 * ROOT CAUSE: The 'cuer' package (v0.0.2) has this issue. RainbowKit uses it internally.
 * 
 * SOLUTION: Pinned to cuer@0.0.2 in package.json overrides. This suppression handles
 * the warning until either:
 * - RainbowKit removes/replaces the cuer dependency
 * - cuer releases a fixed version
 * - We replace RainbowKit with an alternative
 * 
 * TODO: Remove this suppression once the upstream issue is resolved
 * Related: https://github.com/rainbow-me/rainbowkit/issues (check for cuer-related issues)
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error;
  
  console.error = (...args: any[]) => {
    // Suppress the specific errorCorrection prop warning from RainbowKit/cuer
    const errorMessage = args[0];
    if (
      typeof errorMessage === 'string' && 
      errorMessage.includes('React does not recognize the `errorCorrection` prop on a DOM element')
    ) {
      return; // Don't log this specific error
    }
    
    // Log all other errors normally
    originalConsoleError.apply(console, args);
  };
}
