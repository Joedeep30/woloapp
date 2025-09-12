
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { generateAdminUserToken } from '@/lib/auth';
import { z } from 'zod';

const createScheduledReportSchema = z.object({
  report_type: z.enum(['donation_summary', 'qr_usage', 'social_analytics', 'financial_report']),
  report_name: z.string().min(3, 'Le nom du rapport doit contenir au moins 3 caractères'),
  schedule_frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  schedule_time: z.string().default('23:59'),
  recipient_emails: z.array(z.string().email()).min(1, 'Au moins un email destinataire requis'),
  partner_emails: z.array(z.string().email()).optional(),
  parameters: z.any().optional()
});

const updateScheduledReportSchema = z.object({
  report_name: z.string().min(3).optional(),
  schedule_frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  schedule_time: z.string().optional(),
  recipient_emails: z.array(z.string().email()).optional(),
  partner_emails: z.array(z.string().email()).optional(),
  is_active: z.boolean().optional(),
  parameters: z.any().optional(),
  next_send_at: z.string().optional()
});

export const GET = requestMiddleware(async (request: NextRequest) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('report_type');
    const isActive = searchParams.get('is_active');
    
    const adminToken = await generateAdminUserToken();
    const scheduledReportsCrud = new CrudOperations('scheduled_reports', adminToken);
    
    const filters: Record<string, any> = {};
    if (reportType) filters.report_type = reportType;
    if (isActive !== null) filters.is_active = isActive === 'true';
    
    const reports = await scheduledReportsCrud.findMany(filters, {
      limit: limit || 50,
      offset: offset || 0,
      orderBy: { column: 'create_time', direction: 'desc' }
    });
    
    return createSuccessResponse(reports);
  } catch (error) {
    console.error('Erreur lors de la récupération des rapports programmés:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des rapports programmés',
      status: 500,
    });
  }
}, false);

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createScheduledReportSchema.parse(body);
    
    const adminToken = await generateAdminUserToken();
    const scheduledReportsCrud = new CrudOperations('scheduled_reports', adminToken);
    
    // Calculer la prochaine date d'envoi
    const now = new Date();
    const [hours, minutes] = validatedData.schedule_time.split(':').map(Number);
    const nextSend = new Date();
    nextSend.setHours(hours, minutes, 0, 0);
    
    // Si l'heure est déjà passée aujourd'hui, programmer pour demain
    if (nextSend <= now) {
      nextSend.setDate(nextSend.getDate() + 1);
    }
    
    const reportData = {
      ...validatedData,
      next_send_at: nextSend.toISOString(),
      is_active: true
    };
    
    const newReport = await scheduledReportsCrud.create(reportData);
    
    return createSuccessResponse(newReport, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la création du rapport programmé:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la programmation du rapport',
      status: 500,
    });
  }
}, false);

export const PUT = requestMiddleware(async (request: NextRequest) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID du rapport programmé requis',
        status: 400,
      });
    }
    
    const body = await validateRequestBody(request);
    const validatedData = updateScheduledReportSchema.parse(body);
    
    const adminToken = await generateAdminUserToken();
    const scheduledReportsCrud = new CrudOperations('scheduled_reports', adminToken);
    
    // Vérifier si le rapport existe
    const existingReport = await scheduledReportsCrud.findById(id);
    if (!existingReport) {
      return createErrorResponse({
        errorMessage: 'Rapport programmé non trouvé',
        status: 404,
      });
    }
    
    // Recalculer next_send_at si schedule_time a changé
    let updateData: any = { ...validatedData };
    if (validatedData.schedule_time) {
      const now = new Date();
      const [hours, minutes] = validatedData.schedule_time.split(':').map(Number);
      const nextSend = new Date();
      nextSend.setHours(hours, minutes, 0, 0);
      
      if (nextSend <= now) {
        nextSend.setDate(nextSend.getDate() + 1);
      }
      
      updateData.next_send_at = nextSend.toISOString();
    }
    
    const updatedReport = await scheduledReportsCrud.update(id, updateData);
    return createSuccessResponse(updatedReport);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la mise à jour du rapport programmé:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la mise à jour du rapport programmé',
      status: 500,
    });
  }
}, false);

export const DELETE = requestMiddleware(async (request: NextRequest) => {
  try {
    const { id } = parseQueryParams(request);
    
    if (!id) {
      return createErrorResponse({
        errorMessage: 'ID du rapport programmé requis',
        status: 400,
      });
    }
    
    const adminToken = await generateAdminUserToken();
    const scheduledReportsCrud = new CrudOperations('scheduled_reports', adminToken);
    
    // Vérifier si le rapport existe
    const existingReport = await scheduledReportsCrud.findById(id);
    if (!existingReport) {
      return createErrorResponse({
        errorMessage: 'Rapport programmé non trouvé',
        status: 404,
      });
    }
    
    await scheduledReportsCrud.delete(id);
    return createSuccessResponse({ id });
  } catch (error) {
    console.error('Erreur lors de la suppression du rapport programmé:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la suppression du rapport programmé',
      status: 500,
    });
  }
}, false);
