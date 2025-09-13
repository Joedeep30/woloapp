import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { WavePaymentService, WaveWebhookPayload } from '@/lib/wave-payment-service';

export const POST = async (request: NextRequest) => {
  try {
    // Get the raw body and signature
    const body = await request.text();
    const signature = request.headers.get('x-wave-signature') || '';

    // Parse the webhook payload
    let webhookPayload: WaveWebhookPayload;
    try {
      webhookPayload = JSON.parse(body);
    } catch (error) {
      console.error('Invalid JSON in Wave webhook:', error);
      return createErrorResponse({
        errorMessage: 'Invalid JSON payload',
        status: 400,
      });
    }

    // Validate required fields
    if (!webhookPayload.id || !webhookPayload.status) {
      return createErrorResponse({
        errorMessage: 'Missing required webhook fields',
        status: 400,
      });
    }

    console.log('📥 Received Wave webhook:', {
      id: webhookPayload.id,
      status: webhookPayload.status,
      amount: webhookPayload.amount,
      reference: webhookPayload.reference
    });

    // Process the webhook
    const waveService = new WavePaymentService('');
    await waveService.processWebhook(webhookPayload, signature);

    console.log('✅ Successfully processed Wave webhook:', webhookPayload.id);

    // Return success response to Wave
    return createSuccessResponse({
      message: 'Webhook processed successfully',
      webhook_id: webhookPayload.id,
      processed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing Wave webhook:', error);
    
    // Return error but with 200 status to prevent Wave retries
    // In production, you might want to return 500 for actual system errors
    // so Wave retries the webhook
    return createSuccessResponse({
      message: 'Webhook received but processing failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      processed_at: new Date().toISOString()
    });
  }
};

// Only POST method is supported
export const GET = async () => {
  return createErrorResponse({
    errorMessage: 'Method not allowed',
    status: 405,
  });
};

export const PUT = async () => {
  return createErrorResponse({
    errorMessage: 'Method not allowed',
    status: 405,
  });
};

export const DELETE = async () => {
  return createErrorResponse({
    errorMessage: 'Method not allowed',
    status: 405,
  });
};