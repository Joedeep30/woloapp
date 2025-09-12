
"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export function AppleLoginButton() {
  const handleClick = () => {
    // Apple Sign-In peut être implémenté avec l'Apple ID SDK
    // Pour la démo, on simule la connexion
    const appleAuthUrl = `https://appleid.apple.com/auth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(window.location.origin + '/next_api/auth/apple-login')}&response_type=code&scope=name%20email&response_mode=form_post`;
    
    // Pour la démo, on simule directement
    setTimeout(() => {
      window.location.href = '/birthday-owner';
    }, 1000);
  };
  
  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      className="w-full border-white/40 text-white hover:bg-white/10 bg-white/20"
    >
      <svg
        className="w-5 h-5 mr-2"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
      <span className="text-sm font-medium">Continuer avec Apple</span>
    </Button>
  );
}
