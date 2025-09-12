
"use client";

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboardPage() {
  useEffect(() => {
    // Rediriger vers la vraie page admin
    window.location.href = '/admin';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg font-semibold">Redirection vers l'administration...</p>
      </div>
    </div>
  );
}
