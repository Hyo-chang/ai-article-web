import { useEffect, useRef } from "react";

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onError?: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
              locale?: string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn("Google Client ID not configured");
      return;
    }

    const initializeGoogle = () => {
      if (!window.google || initializedRef.current || !buttonRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              onSuccess(response.credential);
            } else {
              onError?.();
            }
          },
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 300,
        });

        initializedRef.current = true;
      } catch (error) {
        console.error("Failed to initialize Google Sign-In:", error);
        onError?.();
      }
    };

    // Load Google Identity Services script
    if (!document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    } else if (window.google) {
      initializeGoogle();
    }
  }, [onSuccess, onError]);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className="flex justify-center">
      <div ref={buttonRef} />
    </div>
  );
}
