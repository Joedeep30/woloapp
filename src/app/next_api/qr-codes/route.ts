
import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody, parseQueryParams } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import CrudOperations from '@/lib/crud-operations';
import { generateRandomString } from '@/lib/server-utils';
import { z } from 'zod';

const createQRCodeSchema = z.object({
  pot_id: z.number(),
  invitee_id: z.number().optional(),
  qr_type: z.enum(['invitee', 'master', 'admin']).default('invitee'),
  payload: z.any().optional()
});

const scanQRCodeSchema = z.object({
  code: z.string(),
  scanned_by: z.string().optional(),
  cinema_location: z.string().optional()
});

export const GET = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const { limit, offset } = parseQueryParams(request);
    const searchParams = request.nextUrl.searchParams;
    const potId = searchParams.get('pot_id');
    const inviteeId = searchParams.get('invitee_id');
    const status = searchParams.get('status');
    
    const qrCodesCrud = new CrudOperations('qr_codes', params.token);
    
    const filters: Record<string, any> = {};
    if (potId) filters.pot_id = parseInt(potId);
    if (inviteeId) filters.invitee_id = parseInt(inviteeId);
    if (status) filters.status = status;
    
    const qrCodes = await qrCodesCrud.findMany(filters, {
      limit: limit || 50,
      offset: offset || 0,
      orderBy: { column: 'issued_at', direction: 'desc' }
    });
    
    return createSuccessResponse(qrCodes);
  } catch (error) {
    console.error('Erreur lors de la récupération des QR codes:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la récupération des QR codes',
      status: 500,
    });
  }
}, true);

export const POST = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = createQRCodeSchema.parse(body);
    
    const qrCodesCrud = new CrudOperations('qr_codes', params.token);
    
    // Générer un code unique
    const code = generateRandomString(16);
    
    const qrCodeData = {
      ...validatedData,
      code: code,
      status: 'issued',
      issued_at: new Date().toISOString()
    };
    
    const newQRCode = await qrCodesCrud.create(qrCodeData);
    
    // Mettre à jour l'invité si applicable
    if (validatedData.invitee_id) {
      const inviteesCrud = new CrudOperations('invitees', params.token);
      await inviteesCrud.update(validatedData.invitee_id, {
        qr_code_generated: true
      });
    }
    
    return createSuccessResponse(newQRCode, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors de la création du QR code:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors de la génération du QR code',
      status: 500,
    });
  }
}, true);

export const PUT = requestMiddleware(async (request: NextRequest, params) => {
  try {
    const body = await validateRequestBody(request);
    const validatedData = scanQRCodeSchema.parse(body);
    
    const qrCodesCrud = new CrudOperations('qr_codes', params.token);
    
    // Trouver le QR code par son code
    const qrCodes = await qrCodesCrud.findMany({ code: validatedData.code });
    
    if (!qrCodes || qrCodes.length === 0) {
      return createErrorResponse({
        errorMessage: 'QR code non trouvé',
        status: 404,
      });
    }
    
    const qrCode = qrCodes[0];
    
    if (qrCode.status === 'redeemed') {
      return createErrorResponse({
        errorMessage: 'QR code déjà utilisé',
        status: 400,
      });
    }
    
    // Mettre à jour le QR code
    const updatedQRCode = await qrCodesCrud.update(qrCode.id, {
      status: 'scanned',
      scanned_at: new Date().toISOString(),
      scanned_by: validatedData.scanned_by,
      cinema_location: validatedData.cinema_location
    });
    
    // Enregistrer l'analytics du scan
    const qrAnalyticsCrud = new CrudOperations('qr_code_analytics', params.token);
    await qrAnalyticsCrud.create({
      qr_code_id: qrCode.id,
      scan_timestamp: new Date().toISOString(),
      scanner_ip: request.headers.get('x-forwarded-for') || 'unknown',
      scanner_user_agent: request.headers.get('user-agent') || 'unknown',
      scan_source: 'cinema_app',
      is_valid_scan: true
    });
    
    return createSuccessResponse(updatedQRCode);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }
    
    console.error('Erreur lors du scan du QR code:', error);
    return createErrorResponse({
      errorMessage: 'Erreur lors du scan du QR code',
      status: 500,
    });
  }
}, true);
