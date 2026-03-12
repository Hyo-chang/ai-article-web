import { useEffect } from "react";

export function useNoAds() {
  useEffect(() => {
    let meta = document.querySelector("meta[name='google-adsense-page-no-ads']") as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "google-adsense-page-no-ads";
      document.head.appendChild(meta);
    }
    meta.content = "true";

    return () => {
      meta.remove();
    };
  }, []);
}
