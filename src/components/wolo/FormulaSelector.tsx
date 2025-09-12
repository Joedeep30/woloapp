
"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Film, Popcorn, Coffee, Gift } from 'lucide-react';
import { Formula } from '@/types/wolo';

interface FormulaSelectorProps {
  formulas: Formula[];
  selectedFormulaId?: number;
  onSelect: (formula: Formula) => void;
  className?: string;
}

export function FormulaSelector({ 
  formulas, 
  selectedFormulaId, 
  onSelect, 
  className = "" 
}: FormulaSelectorProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">
          Formules Pack Ciné
        </h3>
        <p className="text-sm text-white/80">
          De 1 ticket → 10 tickets + Panier Gourmand
        </p>
      </div>

      <div className="grid gap-3">
        {formulas.map((formula, index) => (
          <motion.div
            key={formula.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onHoverStart={() => setHoveredId(formula.id)}
            onHoverEnd={() => setHoveredId(null)}
          >
            <Card 
              className={`cursor-pointer transition-all duration-300 ${
                selectedFormulaId === formula.id
                  ? 'ring-2 ring-orange-400 bg-orange-50/10'
                  : 'hover:bg-white/5'
              } ${
                hoveredId === formula.id ? 'scale-105' : ''
              }`}
              onClick={() => onSelect(formula)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Film className="h-5 w-5 text-orange-400" />
                    <h4 className="font-semibold text-white">
                      {formula.name}
                    </h4>
                  </div>
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-300">
                    {formula.min_tickets} {formula.min_tickets === 1 ? 'ticket' : 'tickets'}
                  </Badge>
                </div>

                <p className="text-sm text-white/80 mb-3">
                  {formula.description}
                </p>

                {/* Inclusions */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {formula.includes_popcorn && (
                    <div className="flex items-center gap-1 text-xs text-green-300">
                      <Popcorn className="h-3 w-3" />
                      <span>Popcorn</span>
                    </div>
                  )}
                  {formula.includes_drinks && (
                    <div className="flex items-center gap-1 text-xs text-blue-300">
                      <Coffee className="h-3 w-3" />
                      <span>Boissons</span>
                    </div>
                  )}
                  {formula.includes_snacks && (
                    <div className="flex items-center gap-1 text-xs text-purple-300">
                      <Gift className="h-3 w-3" />
                      <span>Snacks</span>
                    </div>
                  )}
                </div>

                {/* Prix */}
                {formula.total_price && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/70">
                      {formula.price_per_ticket && (
                        <span>{formatPrice(formula.price_per_ticket)} / ticket</span>
                      )}
                    </div>
                    <div className="text-lg font-bold text-orange-400">
                      {formatPrice(formula.total_price)}
                    </div>
                  </div>
                )}

                {selectedFormulaId === formula.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 p-2 bg-orange-500/20 rounded-lg border border-orange-400/30"
                  >
                    <div className="text-xs text-orange-300 text-center">
                      ✓ Formule sélectionnée
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
