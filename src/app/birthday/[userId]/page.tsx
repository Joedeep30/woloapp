
"use client";

import { useEffect } from 'react';

interface BirthdayPageProps {
  params: Promise<{
    userId: string;
  }>;
  searchParams: Promise<{
    owner?: string;
  }>;
}

export default function BirthdayPage({ params, searchParams }: BirthdayPageProps) {
  useEffect(() => {
    const redirectToUser = async () => {
      const resolvedParams = await params;
      const resolvedSearchParams = await searchParams;
      
      const userId = resolvedParams.userId;
      const isOwner = resolvedSearchParams.owner === 'true';
      
      // Rediriger vers la page utilisateur avec les bons paramètres
      const redirectUrl = `/user/${userId}${isOwner ? '?owner=true' : ''}`;
      window.location.href = redirectUrl;
    };
    
    redirectToUser();
  }, [params, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-lg font-semibold">Redirection en cours...</p>
      </div>
    </div>
  );
}
