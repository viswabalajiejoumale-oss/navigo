/// <reference types="vite/client" />

declare global {
  interface Window {
    google?: {
      maps: any;
    };
  }
  namespace google {
    const maps: any;
  }
}

export {};
