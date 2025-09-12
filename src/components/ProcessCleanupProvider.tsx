
"use client";

interface ProcessCleanupProviderProps {
  children: React.ReactNode;
}

export function ProcessCleanupProvider({ children }: ProcessCleanupProviderProps) {
  // Composant complètement passif - aucune gestion de processus
  return <>{children}</>;
}
