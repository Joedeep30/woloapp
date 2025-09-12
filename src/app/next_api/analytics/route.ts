
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { z } from 'zod';

const trackEventSchema = z.object({
  pot_id: z.number().optional(),
  event_type: z.string().min(1, 'Le type d\'événement est requis'),
  event_category: z.string().min(1, 'La catégorie d\'événement est requise'),
  event_data: z.any().optional(),
  referrer: z.string().optional(),
  session_id: z.string().optional()
});

export const GET = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const potId = searchParams.get('pot_id');
    const eventType = searchParams.get('event_type');
    const eventCategory = searchParams.get('event_category');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
    const analyticsCrud = new CrudOperations('analytics_events', params.token);
    
    const filters: Record<string, any> = {};
    if (potId) filters.pot_id = parseInt(potId);
    if (eventType) filters.event_type = eventType;
    if (eventCategory) filters.event_category = eventCategory;
    
    const events = await analyticsCrud.findMany(filters, {
      limit: limit || 100,
      offset: offset || 0,
      orderBy: { column: 'create_time', direction: 'desc' }
    });
    
    // Filtrer par date si spécifié
    let filteredEvents = events || [];
    if (startDate || endDate) {
      filteredEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.create_time);
        if (startDate && eventDate < new Date(startDate)) return false;
        if (endDate && eventDate > new Date(endDate)) return false;
        return true;
      });
    }
    
    return createSuccessResponse(filteredEvents);
  } catch (error) {
    console.error('Erreur lors de la récupération des analytics:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des données analytics',
      status: 500,
    });
  }
}, true);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = trackEventSchema.parse(body);
    
    const analyticsCrud = new CrudOperations('analytics_events', params.token);
    
    const eventData = {
      ...validatedData,
      user_id: params.payload?.sub ? parseInt(params.payload.sub) : null,
      ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      referrer: validatedData.referrer || request.headers.get('referer') || null
    };
    
    const newEvent = await analyticsCrud.create(eventData);
    return createSuccessResponse(newEvent, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de l\'enregistrement de l\'événement analytics:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de l\'enregistrement de l\'événement',
      status: 500,
    });
  }
}, false); // Pas besoin d'authentification pour tracker les événements

// Route pour obtenir des statistiques agrégées
export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const potId = searchParams.get('pot_id');
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d
    
    const analyticsCrud = new CrudOperations('analytics_events', params.token);
    const donationsCrud = new CrudOperations('donations', params.token);
    const socialSharesCrud = new CrudOperations('social_shares', params.token);
    const qrCodesCrud = new CrudOperations('qr_codes', params.token);
    
    // Calculer la date de début selon la période
    const endDate = new Date();
    const startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
    }
    
    const filters: Record<string, any> = {};
    if (potId) filters.pot_id = parseInt(potId);
    
    // Récupérer les données
    const [events, donations, shares, qrCodes] = await Promise.all([
      analyticsCrud.findMany(filters),
      donationsCrud.findMany(filters),
      socialSharesCrud.findMany(filters),
      qrCodesCrud.findMany(filters)
    ]);
    
    // Filtrer par période
    const filterByPeriod = (items: any[]) => {
      return items?.filter(item => {
        const itemDate = new Date(item.create_time || item.last_shared_at || item.issued_at);
        return itemDate >= startDate && itemDate <= endDate;
      }) || [];
    };
    
    const periodEvents = filterByPeriod(events || []);
    const periodDonations = filterByPeriod(donations || []);
    const periodShares = filterByPeriod(shares || []);
    const periodQRCodes = filterByPeriod(qrCodes || []);
    
    // Calculer les statistiques
    const stats = {
      period,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      page_views: periodEvents.filter(e => e.event_type === 'page_view').length,
      unique_visitors: new Set(periodEvents.map(e => e.ip_address)).size,
      donations: {
        count: periodDonations.filter(d => d.status === 'completed').length,
        total_amount: periodDonations
          .filter(d => d.status === 'completed')
          .reduce((sum, d) => sum + parseFloat(d.amount), 0),
        conversion_rate: periodEvents.length > 0 ? 
          (periodDonations.filter(d => d.status === 'completed').length / periodEvents.length * 100) : 0
      },
      social_shares: {
        total: periodShares.reduce((sum, s) => sum + s.share_count, 0),
        by_platform: periodShares.reduce((acc, share) => {
          acc[share.platform] = (acc[share.platform] || 0) + share.share_count;
          return acc;
        }, {} as Record<string, number>)
      },
      qr_codes: {
        generated: periodQRCodes.length,
        scanned: periodQRCodes.filter(qr => qr.status === 'scanned' || qr.status === 'redeemed').length,
        usage_rate: periodQRCodes.length > 0 ? 
          (periodQRCodes.filter(qr => qr.status === 'scanned' || qr.status === 'redeemed').length / periodQRCodes.length * 100) : 0
      }
    };
    
    return createSuccessResponse(stats);
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors du calcul des statistiques',
      status: 500,
    });
  }
}, true);
