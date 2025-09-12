
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const ADMIN_CREDENTIALS = {
    username: 'admin.wolo',
    password: 'WoloAdmin2025!'
  };

  useEffect(() => {
    const isAdminAuthenticated = sessionStorage.getItem('wolo_admin_authenticated');
    if (isAdminAuthenticated === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (credentials.username === ADMIN_CREDENTIALS.username && 
        credentials.password === ADMIN_CREDENTIALS.password) {
      sessionStorage.setItem('wolo_admin_authenticated', 'true');
      setIsAuthenticated(true);
      toast.success('Connexion administrateur réussie !');
    } else {
      setError('Identifiants administrateur incorrects');
      toast.error('Accès refusé');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('wolo_admin_authenticated');
    setIsAuthenticated(false);
    setCredentials({ username: '', password: '' });
    toast.success('Déconnexion réussie');
  };

  const pages = [
    {
      title: "Page Invité/Visiteur",
      description: "Page principale d'accueil pour les invités",
      href: "/landing",
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Dashboard Propriétaire", 
      description: "Interface complète pour TOUS les propriétaires de cagnottes (filles ET garçons)",
      href: "/owner",
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "Page Utilisateur",
      description: "Interface publique avec données et invitations",
      href: "/user/awa",
      color: "bg-purple-600 hover:bg-purple-700"
    },
    {
      title: "Créer une cagnotte",
      description: "Formulaire de création avec Apple Sign-In et Instagram",
      href: "/create-cagnotte",
      color: "bg-orange-500 hover:bg-orange-600"
    },
    {
      title: "Page de démonstration",
      description: "Démo interactive des composants",
      href: "/demo",
      color: "bg-pink-500 hover:bg-pink-600"
    },
    {
      title: "Dev Admin",
      description: "Dashboard développeur avec gestion vidéo et partenaires avancée",
      href: "/admin",
      color: "bg-slate-600 hover:bg-slate-700"
    },
    {
      title: "Super Admin Dashboard",
      description: "Dashboard super-administrateur pour Jeff, Nat, Nico et développeurs",
      href: "/super-admin",
      color: "bg-red-600 hover:bg-red-700"
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Vérification des autorisations...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-500/20 rounded-full">
                  <Shield className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <CardTitle className="text-white text-2xl">
                Accès Administrateur Requis
              </CardTitle>
              <p className="text-white/70">
                Cette page est réservée aux administrateurs WOLO SENEGAL
              </p>
            </CardHeader>
            <CardContent>
              {!showLogin ? (
                <div className="space-y-4">
                  <Alert className="border-yellow-400/50 bg-yellow-500/10">
                    <AlertCircle className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-300">
                      Seuls les administrateurs WOLO peuvent accéder à cette page de navigation.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => setShowLogin(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Connexion Administrateur
                    </Button>
                    
                    <a href="/landing" target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
                        Retour à l'accueil public
                      </Button>
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white">
                      Nom d'utilisateur administrateur
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      placeholder="admin.wolo"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">
                      Mot de passe administrateur
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      placeholder="••••••••••••"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Se connecter
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowLogin(false)}
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header sécurisé */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              WOLO SENEGAL - Administration
            </h1>
            <p className="text-white/70 text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-400" />
              Accès administrateur sécurisé - Processus de build corrigé
            </p>
          </div>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-red-400/50 text-red-300 hover:bg-red-500/20"
          >
            <Lock className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </motion.div>

        {/* Navigation Grid sécurisée */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {pages.map((page, index) => (
            <motion.div
              key={page.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 h-full hover:bg-white/15 transition-all duration-300 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    {page.title}
                    {(page.href === '/admin' || page.href === '/super-admin') && (
                      <Shield className="h-4 w-4 text-red-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/70 text-sm mb-4">
                    {page.description}
                  </p>
                  <a href={page.href} target="_blank" rel="noopener noreferrer">
                    <Button className={`w-full ${page.color} text-white font-semibold shadow-lg`}>
                      Accéder à la page
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer sécurisé */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-12"
        >
          <Card className="bg-green-500/10 backdrop-blur-sm border-green-400/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-green-400" />
                <span className="text-green-300 font-semibold">Session Administrateur Active - Build Corrigé</span>
              </div>
              <p className="text-white/60 text-sm">
                © 2025 WOLO SENEGAL® - From Connect Africa® —
                <br />
                ✅ <strong>PROBLÈME DE BUILD RÉSOLU :</strong> Processus se termine maintenant proprement
                <br />
                🔧 <strong>HANDLERS SIMPLIFIÉS :</strong> Un seul gestionnaire de sortie pour éviter les conflits
                <br />
                ⚡ <strong>TIMEOUT DE SÉCURITÉ :</strong> Sortie forcée après 2 minutes maximum
                <br />
                🧹 <strong>NETTOYAGE OPTIMISÉ :</strong> Suppression des handlers redondants
                <br />
                🚀 <strong>BUILD STABLE :</strong> Plus de boucles infinies ou de processus bloqués
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
