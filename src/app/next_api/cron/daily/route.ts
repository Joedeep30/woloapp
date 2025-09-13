import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { SchedulerService } from '@/lib/scheduler-service';
import { WavePaymentService } from '@/lib/wave-payment-service';

// This endpoint should be called by a cron job (Vercel Cron, GitHub Actions, etc.)
export const POST = async (request: NextRequest) => {
  try {
    // Verify cron secret to prevent unauthorized access
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || cronSecret !== expectedSecret) {
      console.error('Unauthorized cron request');
      return createErrorResponse({
        errorMessage: 'Unauthorized',
        status: 401,
      });
    }

    console.log('🚀 Starting daily cron tasks...');
    const startTime = Date.now();

    const results = {
      scheduler_tasks: null as any,
      wave_reconciliation: null as any,
      errors: [] as string[]
    };

    try {
      // Run scheduler tasks (J-30 pot creation, reminders, etc.)
      console.log('📅 Running scheduler tasks...');
      const schedulerService = new SchedulerService();
      await schedulerService.runDailyTasks();
      results.scheduler_tasks = {
        status: 'completed',
        completed_at: new Date().toISOString()
      };
      console.log('✅ Scheduler tasks completed');
    } catch (error) {
      console.error('❌ Error in scheduler tasks:', error);
      results.errors.push(`Scheduler error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.scheduler_tasks = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    try {
      // Run Wave payment reconciliation
      console.log('💰 Running Wave payment reconciliation...');
      const waveService = new WavePaymentService('');
      await waveService.reconcilePayments();
      results.wave_reconciliation = {
        status: 'completed',
        completed_at: new Date().toISOString()
      };
      console.log('✅ Wave reconciliation completed');
    } catch (error) {
      console.error('❌ Error in Wave reconciliation:', error);
      results.errors.push(`Wave reconciliation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.wave_reconciliation = {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`✅ Daily cron tasks completed in ${duration}ms`);

    return createSuccessResponse({
      message: 'Daily cron tasks completed',
      execution_time_ms: duration,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date(endTime).toISOString(),
      results: results
    });

  } catch (error) {
    console.error('❌ Fatal error in daily cron:', error);
    return createErrorResponse({
      errorMessage: `Fatal error in daily cron tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 500
    });
  }
};

// GET method for health check
export const GET = async (request: NextRequest) => {
  const cronSecret = request.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || cronSecret !== expectedSecret) {
    return createErrorResponse({
      errorMessage: 'Unauthorized',
      status: 401,
    });
  }

  return createSuccessResponse({
    message: 'Daily cron endpoint is healthy',
    last_check: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown'
  });
};

// Other methods not allowed
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