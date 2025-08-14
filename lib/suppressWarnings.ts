// Suppress specific React warnings in development
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
