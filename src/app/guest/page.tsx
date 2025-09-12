
"use client";

import { useEffect } from 'react';

export default function GuestPage() {
  useEffect(() => {
    // Rediriger vers la page utilisateur Awa
    window.location.href = '/user/awa';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg font-semibold">Redirection vers la page invité...</p>
      </div>
    </div>
  );
}
