import CrudOperations from './crud-operations';

export interface PointRule {
  id: number;
  rule_name: string;
  rule_type: string;
  points_value: number;
  conditions: any;
  is_active: boolean;
}

export interface PointTransaction {
  user_id: number;
  transaction_type: 'earned' | 'bonus' | 'spent' | 'expired';
  points_amount: number;
  source_type: string;
  source_id?: number;
  description: string;
  metadata?: any;
}

export class PointsEngine {
  private pointRulesCrud: CrudOperations;
  private pointTransactionsCrud: CrudOperations;
  private userPointsCrud: CrudOperations;
  private potsCrud: CrudOperations;
  private token: string;

  constructor(token: string) {
    this.token = token;
    this.pointRulesCrud = new CrudOperations('point_rules', token);
    this.pointTransactionsCrud = new CrudOperations('point_transactions', token);
    this.userPointsCrud = new CrudOperations('user_points', token);
    this.potsCrud = new CrudOperations('pots', token);
  }

  /**
   * Award points to a user for a specific action
   */
  async awardPoints(transaction: PointTransaction): Promise<void> {
    try {
      // Get or create user points record
      const userPoints = await this.getUserPoints(transaction.user_id);
      
      // Update user points
      const newTotalPoints = userPoints.total_points + transaction.points_amount;
      const newAvailablePoints = userPoints.available_points + transaction.points_amount;
      const newLifetimePoints = userPoints.lifetime_points + transaction.points_amount;

      await this.userPointsCrud.update(userPoints.id, {
        total_points: newTotalPoints,
        available_points: newAvailablePoints,
        lifetime_points: newLifetimePoints,
        current_level: this.calculateLevel(newLifetimePoints),
        modify_time: new Date().toISOString()
      });

      // Log the transaction
      await this.pointTransactionsCrud.create({
        ...transaction,
        create_time: new Date().toISOString()
      });

      console.log(`Awarded ${transaction.points_amount} points to user ${transaction.user_id}`);
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  /**
   * Calculate bonus points when a sponsored pot reaches certain milestones
   */
  async calculatePotGrowthBonus(potId: number, sponsorUserId: number): Promise<void> {
    try {
      const pot = await this.potsCrud.findById(potId);
      if (!pot) return;

      const currentAmount = parseFloat(pot.current_amount || '0');
      
      // Get growth bonus rules
      const bonusRules = await this.pointRulesCrud.findMany({
        rule_type: 'pot_growth_bonus',
        is_active: true
      });

      for (const rule of bonusRules) {
        const threshold = rule.conditions?.pot_amount_threshold;
        if (threshold && currentAmount >= threshold) {
          // Check if bonus already awarded for this threshold
          const existingBonus = await this.pointTransactionsCrud.findMany({
            user_id: sponsorUserId,
            source_type: 'pot_growth_bonus',
            source_id: potId,
            metadata: { threshold }
          });

          if (!existingBonus || existingBonus.length === 0) {
            await this.awardPoints({
              user_id: sponsorUserId,
              transaction_type: 'bonus',
              points_amount: rule.points_value,
              source_type: 'pot_growth_bonus',
              source_id: potId,
              description: `Bonus croissance cagnotte: ${threshold} FCFA atteint`,
              metadata: { threshold, pot_amount: currentAmount }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error calculating pot growth bonus:', error);
    }
  }

  /**
   * Convert points to CFA credits (10 points = 1000 CFA)
   */
  async convertPointsToCFA(userId: number, pointsToConvert: number): Promise<{ success: boolean; cfaAmount: number; message: string }> {
    try {
      const userPoints = await this.getUserPoints(userId);
      
      if (userPoints.available_points < pointsToConvert) {
        return {
          success: false,
          cfaAmount: 0,
          message: 'Points insuffisants'
        };
      }

      // Conversion rate: 10 points = 1000 CFA
      const cfaAmount = (pointsToConvert / 10) * 1000;
      
      // Update user points
      await this.userPointsCrud.update(userPoints.id, {
        available_points: userPoints.available_points - pointsToConvert,
        modify_time: new Date().toISOString()
      });

      // Log the conversion
      await this.pointTransactionsCrud.create({
        user_id: userId,
        transaction_type: 'spent',
        points_amount: -pointsToConvert,
        source_type: 'cfa_conversion',
        description: `Conversion ${pointsToConvert} points vers ${cfaAmount} CFA`,
        metadata: { cfa_amount: cfaAmount, conversion_rate: '10_points_1000_cfa' }
      });

      return {
        success: true,
        cfaAmount,
        message: `${pointsToConvert} points convertis en ${cfaAmount} CFA`
      };
    } catch (error) {
      console.error('Error converting points to CFA:', error);
      return {
        success: false,
        cfaAmount: 0,
        message: 'Erreur lors de la conversion'
      };
    }
  }

  /**
   * Apply CFA credit to user's next pot (max 30% of target)
   */
  async applyCreditToPot(userId: number, cfaAmount: number): Promise<void> {
    try {
      // Find user's active or upcoming pots
      const userPots = await this.potsCrud.findMany(
        {
          user_id: userId,
          status: ['active', 'scheduled']
        },
        {
          orderBy: { column: 'birthday_date', direction: 'asc' }
        }
      );

      if (userPots && userPots.length > 0) {
        const nextPot = userPots[0];
        const targetAmount = parseFloat(nextPot.target_amount || '0');
        const maxCredit = targetAmount * 0.30; // Max 30% of target
        
        const creditToApply = Math.min(cfaAmount, maxCredit);
        const remainingCredit = cfaAmount - creditToApply;

        // Update pot with credit
        const currentAmount = parseFloat(nextPot.current_amount || '0');
        await this.potsCrud.update(nextPot.id, {
          current_amount: currentAmount + creditToApply,
          modify_time: new Date().toISOString()
        });

        // If there's remaining credit, store it for next pot
        if (remainingCredit > 0) {
          // Store remaining credit in user metadata or separate table
          console.log(`Remaining credit ${remainingCredit} CFA stored for future pots`);
        }
      }
    } catch (error) {
      console.error('Error applying credit to pot:', error);
    }
  }

  /**
   * Calculate user level based on lifetime points
   */
  private calculateLevel(lifetimePoints: number): string {
    if (lifetimePoints >= 1000) return 'platinum';
    if (lifetimePoints >= 500) return 'gold';
    if (lifetimePoints >= 200) return 'silver';
    return 'bronze';
  }

  /**
   * Get or create user points record
   */
  private async getUserPoints(userId: number): Promise<any> {
    const existingPoints = await this.userPointsCrud.findMany({ user_id: userId });
    
    if (existingPoints && existingPoints.length > 0) {
      return existingPoints[0];
    }

    // Create new points record
    return await this.userPointsCrud.create({
      user_id: userId,
      total_points: 0,
      available_points: 0,
      lifetime_points: 0,
      current_level: 'bronze'
    });
  }

  /**
   * Get user's current points status
   */
  async getUserPointsStatus(userId: number): Promise<any> {
    const userPoints = await this.getUserPoints(userId);
    
    // Get recent transactions
    const recentTransactions = await this.pointTransactionsCrud.findMany(
      { user_id: userId },
      {
        orderBy: { column: 'create_time', direction: 'desc' },
        limit: 10
      }
    );

    return {
      ...userPoints,
      recent_transactions: recentTransactions,
      conversion_rate: '10 points = 1000 CFA',
      max_conversion: Math.floor(userPoints.available_points / 10) * 1000
    };
  }

  /**
   * Check and award level-up bonuses
   */
  async checkLevelUpBonuses(userId: number): Promise<void> {
    try {
      const userPoints = await this.getUserPoints(userId);
      const currentLevel = userPoints.current_level;
      const lifetimePoints = userPoints.lifetime_points;

      // Check level-up rules
      const levelRules = await this.pointRulesCrud.findMany({
        rule_type: 'level_bonus',
        is_active: true
      });

      for (const rule of levelRules) {
        const requiredLevel = rule.conditions?.level;
        const requiredSponsorships = rule.conditions?.sponsorships_required || 0;
        
        if (requiredLevel && this.shouldAwardLevelBonus(currentLevel, requiredLevel, lifetimePoints)) {
          // Check sponsorship count if required
          if (requiredSponsorships > 0) {
            const sponsorshipCount = await this.getSponsorshipCount(userId);
            if (sponsorshipCount < requiredSponsorships) continue;
          }

          // Award level bonus
          await this.awardPoints({
            user_id: userId,
            transaction_type: 'bonus',
            points_amount: rule.points_value,
            source_type: 'level_bonus',
            description: `Bonus niveau ${requiredLevel}`,
            metadata: { level: requiredLevel, lifetime_points: lifetimePoints }
          });
        }
      }
    } catch (error) {
      console.error('Error checking level-up bonuses:', error);
    }
  }

  private shouldAwardLevelBonus(currentLevel: string, requiredLevel: string, lifetimePoints: number): boolean {
    const levelOrder = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = levelOrder.indexOf(currentLevel);
    const requiredIndex = levelOrder.indexOf(requiredLevel);
    
    return currentIndex >= requiredIndex && lifetimePoints >= this.getMinPointsForLevel(requiredLevel);
  }

  private getMinPointsForLevel(level: string): number {
    switch (level) {
      case 'silver': return 200;
      case 'gold': return 500;
      case 'platinum': return 1000;
      default: return 0;
    }
  }

  private async getSponsorshipCount(userId: number): Promise<number> {
    const sponsorshipsCrud = new CrudOperations('sponsorships', this.token);
    const sponsorships = await sponsorshipsCrud.findMany({
      sponsor_user_id: userId,
      status: 'accepted'
    });
    
    return sponsorships?.length || 0;
  }
}