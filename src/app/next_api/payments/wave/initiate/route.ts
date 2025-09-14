import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/create-response";
import { validateRequestBody, requestMiddleware } from "@/lib/api-utils";
import { WavePaymentService, WavePaymentRequest } from "@/lib/wave-payment-service";

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const body = (await validateRequestBody(request)) as Partial<WavePaymentRequest>;

    if (!body.pot_id || !body.amount) {
      return createErrorResponse({
        errorMessage: "Missing required fields: pot_id, amount",
        status: 400,
      });
    }

    const svc = new WavePaymentService("");
    const result = await svc.initiatePayment({
      pot_id: Number(body.pot_id),
      donor_name: body.donor_name || undefined,
      donor_email: body.donor_email || undefined,
      donor_phone: body.donor_phone || undefined,
      amount: Number(body.amount),
      message: body.message || undefined,
      is_anonymous: !!body.is_anonymous,
      show_name_consent: !!body.show_name_consent,
      show_amount_consent: !!body.show_amount_consent,
      return_url: body.return_url || undefined,
    });

    return createSuccessResponse(result, 200);
  } catch (error: any) {
    return createErrorResponse({
      errorMessage: error?.message || "Failed to initiate payment",
      status: 500,
    });
  }
}, false);