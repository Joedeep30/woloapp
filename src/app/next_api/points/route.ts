
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { PointsEngine } from '@/lib/points-engine';
import { z } from 'zod';

const awardPointsSchema = z.object({
  user_id: z.number(),
  points_amount: z.number().positive('Le nombre de points doit être positif'),
  transaction_type: z.string().min(1, 'Type de transaction requis'),
  source_type: z.string().min(1, 'Type de source requis'),
  source_id: z.number().optional(),
  description: z.string().optional(),
  metadata: z.any().optional()
});

export const GET = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const transactionType = searchParams.get('transaction_type');
    
    // Si user_id n'est pas fourni, utiliser l'utilisateur connecté
    const targetUserId = userId ? parseInt(userId) : parseInt(params.payload?.sub || '0');
    
    if (userId && userId !== params.payload?.sub && params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Vous ne pouvez consulter que vos propres points',
        status: 403,
      });
    }
    
    const userPointsCrud = new CrudOperations('user_points', params.token);
    const pointTransactionsCrud = new CrudOperations('point_transactions', params.token);
    
    // Récupérer le solde de points
    const userPoints = await userPointsCrud.findMany({ user_id: targetUserId });
    const pointsBalance = userPoints?.[0] || {
      total_points: 0,
      available_points: 0,
      lifetime_points: 0,
      current_level: 'bronze'
    };
    
    // Récupérer l'historique des transactions
    const filters: Record<string, any> = { user_id: targetUserId };
    if (transactionType) filters.transaction_type = transactionType;
    
    const transactions = await pointTransactionsCrud.findMany(filters, {
      limit: limit || 50,
      offset: offset || 0,
      orderBy: { column: 'create_time', direction: 'desc' }
    });
    
    return createSuccessResponse({
      balance: pointsBalance,
      transactions: transactions || []
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des points:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des points',
      status: 500,
    });
  }
}, true);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = awardPointsSchema.parse(body);
    
    // Seuls les admins peuvent attribuer des points manuellement
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      return createErrorResponse({
        errorMessage: 'Seuls les administrateurs peuvent attribuer des points',
        status: 403,
      });
    }
    
    const userPointsCrud = new CrudOperations('user_points', params.token);
    const pointTransactionsCrud = new CrudOperations('point_transactions', params.token);
    
    // Vérifier si l'utilisateur existe
    const usersCrud = new CrudOperations('users', params.token);
    const user = await usersCrud.findById(validatedData.user_id);
    
    if (!user) {
      return createErrorResponse({
        errorMessage: 'Utilisateur non trouvé',
        status: 404,
      });
    }
    
    // Récupérer ou créer le record de points de l'utilisateur
    const existingPoints = await userPointsCrud.findMany({
      user_id: validatedData.user_id
    });
    
    let updatedPoints;
    
    if (existingPoints && existingPoints.length > 0) {
      const currentPoints = existingPoints[0];
      updatedPoints = await userPointsCrud.update(currentPoints.id, {
        total_points: currentPoints.total_points + validatedData.points_amount,
        available_points: currentPoints.available_points + validatedData.points_amount,
        lifetime_points: currentPoints.lifetime_points + validatedData.points_amount
      });
    } else {
      updatedPoints = await userPointsCrud.create({
        user_id: validatedData.user_id,
        total_points: validatedData.points_amount,
        available_points: validatedData.points_amount,
        lifetime_points: validatedData.points_amount,
        current_level: 'bronze'
      });
    }
    
    // Enregistrer la transaction
    const transaction = await pointTransactionsCrud.create({
      user_id: validatedData.user_id,
      transaction_type: validatedData.transaction_type,
      points_amount: validatedData.points_amount,
      source_type: validatedData.source_type,
      source_id: validatedData.source_id,
      description: validatedData.description || `Attribution manuelle de ${validatedData.points_amount} points`,
      metadata: validatedData.metadata
    });
    
    // Créer une notification
    const notificationsCrud = new CrudOperations('notifications', params.token);
    await notificationsCrud.create({
      user_id: validatedData.user_id,
      type: 'points_awarded',
      title: 'Points attribués !',
      message: `Vous avez reçu ${validatedData.points_amount} points`,
      channel: 'email',
      recipient: user.email,
      status: 'pending'
    });
    
    return createSuccessResponse({
      points_balance: updatedPoints,
      transaction: transaction
    }, 201);
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de l\'attribution des points:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de l\'attribution des points',
      status: 500,
    });
  }
}, true);

// Route pour calculer et attribuer les points bonus basés sur la croissance de la cagnotte
export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const { pot_id, new_amount } = body;
    
    if (!pot_id || !new_amount) {
      return createErrorResponse({
        errorMessage: 'ID de la cagnotte et nouveau montant requis',
        status: 400,
      });
    }
    
    const sponsorshipsCrud = new CrudOperations('sponsorships', params.token);
    const userPointsCrud = new CrudOperations('user_points', params.token);
    const pointTransactionsCrud = new CrudOperations('point_transactions', params.token);
    
    // Trouver le parrainage lié à cette cagnotte
    const sponsorships = await sponsorshipsCrud.findMany({
      pot_id: parseInt(pot_id),
      status: 'accepted'
    });
    
    if (!sponsorships || sponsorships.length === 0) {
      return createSuccessResponse({ message: 'Aucun parrainage trouvé pour cette cagnotte' });
    }
    
    const sponsorship = sponsorships[0];
    
    // Définir les seuils de bonus
    const bonusThresholds = [
      { threshold: 25000, points: 5, description: 'Cagnotte 25K FCFA atteinte' },
      { threshold: 50000, points: 10, description: 'Cagnotte 50K FCFA atteinte' },
      { threshold: 100000, points: 20, description: 'Cagnotte 100K FCFA atteinte' }
    ];
    
    // Calculer les nouveaux bonus à attribuer
    const currentBonusPoints = sponsorship.bonus_points || 0;
    let newBonusPoints = 0;
    
    for (const threshold of bonusThresholds) {
      if (new_amount >= threshold.threshold) {
        newBonusPoints = Math.max(newBonusPoints, threshold.points);
      }
    }
    
    // Si de nouveaux points bonus sont disponibles
    if (newBonusPoints > currentBonusPoints) {
      const pointsToAward = newBonusPoints - currentBonusPoints;
      
      // Mettre à jour les points du parrain
      const existingPoints = await userPointsCrud.findMany({
        user_id: sponsorship.sponsor_user_id
      });
      
      if (existingPoints && existingPoints.length > 0) {
        const currentPoints = existingPoints[0];
        await userPointsCrud.update(currentPoints.id, {
          total_points: currentPoints.total_points + pointsToAward,
          available_points: currentPoints.available_points + pointsToAward,
          lifetime_points: currentPoints.lifetime_points + pointsToAward
        });
      }
      
      // Enregistrer la transaction de bonus
      await pointTransactionsCrud.create({
        user_id: sponsorship.sponsor_user_id,
        transaction_type: 'sponsorship_bonus',
        points_amount: pointsToAward,
        source_type: 'pot_growth',
        source_id: parseInt(pot_id),
        description: `Bonus pour croissance de cagnotte (${new_amount} FCFA)`,
        metadata: {
          pot_amount: new_amount,
          threshold_reached: bonusThresholds.find(t => t.points === newBonusPoints)?.threshold
        }
      });
      
      // Mettre à jour le parrainage avec les nouveaux points bonus
      await sponsorshipsCrud.update(sponsorship.id, {
        bonus_points: newBonusPoints
      });
      
      // Créer une notification pour le parrain
      const notificationsCrud = new CrudOperations('notifications', params.token);
      await notificationsCrud.create({
        user_id: sponsorship.sponsor_user_id,
        pot_id: parseInt(pot_id),
        type: 'bonus_points_awarded',
        title: 'Points bonus gagnés !',
        message: `Votre filleul a atteint ${new_amount} FCFA ! Vous gagnez ${pointsToAward} points bonus.`,
        channel: 'email',
        recipient: 'sponsor@example.com',
        status: 'pending'
      });
      
      return createSuccessResponse({
        points_awarded: pointsToAward,
        total_bonus_points: newBonusPoints,
        threshold_reached: bonusThresholds.find(t => t.points === newBonusPoints)?.threshold
      });
    }
    
    return createSuccessResponse({ message: 'Aucun nouveau bonus à attribuer' });
    
  } catch (error) {
    console.error('Erreur lors du calcul des points bonus:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors du calcul des points bonus',
      status: 500,
    });
  }
}, false); // Peut être appelé par des webhooks sans authentification
