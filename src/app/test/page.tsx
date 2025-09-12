
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-6 flex items-center justify-center">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-md">
        <CardHeader>
          <CardTitle className="text-white text-center">
            ✅ Page de test
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-white/80">
            Cette page fonctionne correctement !
          </p>
          <p className="text-white/60 text-sm">
            Le routage Next.js est opérationnel.
          </p>
          <Link href="/index">
            <Button className="bg-white/20 hover:bg-white/30 text-white">
              Retour à l'index
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
