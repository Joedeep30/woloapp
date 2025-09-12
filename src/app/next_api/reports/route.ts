
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { z } from 'zod';

const generateReportSchema = z.object({
  report_type: z.enum(['donation_summary', 'qr_usage', 'social_analytics', 'financial_report']),
  report_name: z.string().min(3, 'Le nom du rapport doit contenir au moins 3 caractères'),
  parameters: z.any().optional(),
  pot_id: z.number().optional()
});

export const GET = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('report_type');
    const status = searchParams.get('status');
    const potId = searchParams.get('pot_id');
    
    const reportsCrud = new CrudOperations('generated_reports', params.token);
    
    const filters: Record<string, any> = {};
    if (reportType) filters.report_type = reportType;
    if (status) filters.status = status;
    if (potId) filters.pot_id = parseInt(potId);
    
    // Filtrer par utilisateur si ce n'est pas un admin
    if (params.payload?.role !== 'app20250905024110cvidyeburp_v1_admin_user') {
      filters.generated_by = parseInt(params.payload?.sub || '0');
    }
    
    const reports = await reportsCrud.findMany(filters, {
      limit: limit || 20,
      offset: offset || 0,
      orderBy: { column: 'create_time', direction: 'desc' }
    });
    
    return createSuccessResponse(reports);
  } catch (error) {
    console.error('Erreur lors de la récupération des rapports:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des rapports',
      status: 500,
    });
  }
}, true);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = generateReportSchema.parse(body);
    
    const reportsCrud = new CrudOperations('generated_reports', params.token);
    
    const reportData = {
      ...validatedData,
      generated_by: parseInt(params.payload?.sub || '0'),
      status: 'generating',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours
    };
    
    const newReport = await reportsCrud.create(reportData);
    
    // Simuler la génération du rapport en arrière-plan
    setTimeout(async () => {
      try {
        const reportContent = await generateReportContent(validatedData.report_type, validatedData.parameters, params.token);
        
        await reportsCrud.update(newReport.id, {
          status: 'completed',
          file_path: `/reports/${newReport.id}.pdf`,
          file_size: Math.floor(Math.random() * 1000000) + 50000 // Simulation
        });
      } catch (error) {
        console.error('Erreur lors de la génération du rapport:', error);
        await reportsCrud.update(newReport.id, {
          status: 'failed',
          error_message: 'Erreur lors de la génération du rapport'
        });
      }
    }, 3000);
    
    return createSuccessResponse(newReport, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la création du rapport:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la demande de génération du rapport',
      status: 500,
    });
  }
}, true);

// Fonction pour générer le contenu du rapport
async function generateReportContent(reportType: string, parameters: any, token: string) {
  const donationsCrud = new CrudOperations('donations', token);
  const potsCrud = new CrudOperations('pots', token);
  const qrCodesCrud = new CrudOperations('qr_codes', token);
  const socialSharesCrud = new CrudOperations('social_shares', token);
  
  switch (reportType) {
    case 'donation_summary':
      const donations = await donationsCrud.findMany({ status: 'completed' });
      return {
        total_donations: donations?.length || 0,
        total_amount: donations?.reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0,
        average_donation: donations?.length ? (donations.reduce((sum, d) => sum + parseFloat(d.amount), 0) / donations.length) : 0
      };
      
    case 'qr_usage':
      const qrCodes = await qrCodesCrud.findMany({});
      const scannedCodes = qrCodes?.filter(qr => qr.status === 'scanned' || qr.status === 'redeemed') || [];
      return {
        total_qr_codes: qrCodes?.length || 0,
        scanned_codes: scannedCodes.length,
        usage_rate: qrCodes?.length ? (scannedCodes.length / qrCodes.length * 100) : 0
      };
      
    case 'social_analytics':
      const shares = await socialSharesCrud.findMany({});
      const sharesByPlatform = shares?.reduce((acc, share) => {
        acc[share.platform] = (acc[share.platform] || 0) + share.share_count;
        return acc;
      }, {} as Record<string, number>) || {};
      return {
        total_shares: shares?.reduce((sum, s) => sum + s.share_count, 0) || 0,
        shares_by_platform: sharesByPlatform
      };
      
    case 'financial_report':
      const allDonations = await donationsCrud.findMany({ status: 'completed' });
      const totalAmount = allDonations?.reduce((sum, d) => sum + parseFloat(d.amount), 0) || 0;
      return {
        total_revenue: totalAmount,
        wolo_commission: totalAmount * 0.1, // 10% commission
        partner_share: totalAmount * 0.9
      };
      
    default:
      throw new Error('Type de rapport non supporté');
  }
}
