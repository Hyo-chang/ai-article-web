import { useEffect } from "react";

export function useCanonical(path: string) {
  useEffect(() => {
    const url = `https://www.aharead.com${path}`;
    let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = url;

    return () => {
      link.href = "https://www.aharead.com/";
    };
  }, [path]);
}
