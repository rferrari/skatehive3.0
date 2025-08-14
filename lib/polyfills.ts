// Polyfills for server-side rendering
if (typeof window === 'undefined' && typeof globalThis !== 'undefined') {
  // Polyfill indexedDB for server-side rendering to prevent errors from libraries
  if (typeof globalThis.indexedDB === 'undefined') {
    // Create a minimal mock that won't break libraries that check for indexedDB
    globalThis.indexedDB = {
      open: () => ({
        onerror: null,
        onsuccess: null,
        onupgradeneeded: null,
        result: null,
        error: null
      }),
      deleteDatabase: () => ({}),
      cmp: () => 0,
      databases: () => Promise.resolve([])
    } as any;
  }
  
  // Polyfill other browser APIs that might be missing
  if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as any;
  }
  
  if (typeof globalThis.sessionStorage === 'undefined') {
    globalThis.sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null,
    } as any;
  }
}
