export function loadGoogleMaps(apiKey: string) {
  const src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("No window"));
    if ((window as any).__navigo_google_maps_loaded) return resolve();
    if (document.querySelector(`script[src="${src}"]`)) {
      (window as any).__navigo_google_maps_loaded = true;
      return resolve();
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      (window as any).__navigo_google_maps_loaded = true;
      resolve();
    };
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}
