
"use client";

import { useEffect } from 'react';

export default function BirthdayOwnerRedirect() {
  useEffect(() => {
    // Rediriger vers la nouvelle page propriétaire unifiée
    window.location.href = '/owner';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg font-semibold">Redirection vers le dashboard propriétaire...</p>
      </div>
    </div>
  );
}
