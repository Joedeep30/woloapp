import { NextRequest } from "next/server";
import { createErrorResponse, createSuccessResponse } from "@/lib/create-response";
import { validateRequestBody, requestMiddleware } from "@/lib/api-utils";
import { WhatsAppService, BulkMessage } from "@/lib/whatsapp-service";

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const body = await validateRequestBody(request);
    const { userId, message } = body as { userId: number; message: BulkMessage };

    if (!userId || !message || !Array.isArray(message.recipients) || !message.message_text) {
      return createErrorResponse({
        errorMessage: "Missing required fields: userId, message{recipients[], message_text}",
        status: 400,
      });
    }

    const svc = new WhatsAppService();
    const result = await svc.sendBulkMessage(Number(userId), message);

    return createSuccessResponse(result, 200);
  } catch (error: any) {
    return createErrorResponse({
      errorMessage: error?.message || "Failed to queue WhatsApp messages",
      status: 500,
    });
  }
}, false);