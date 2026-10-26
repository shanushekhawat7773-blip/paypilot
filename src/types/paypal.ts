export interface PayPalTokenResponse {
  scope: string;
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  nonce: string;
}

export interface PayPalAmount {
  currency_code: string;
  value: string;
}

export interface PayPalPurchaseUnit {
  reference_id?: string;
  description?: string;
  custom_id?: string;
  invoice_id?: string;
  amount: PayPalAmount;
  payee?: {
    email_address?: string;
    merchant_id?: string;
  };
}

export interface PayPalCreateOrderRequest {
  intent: "CAPTURE" | "AUTHORIZE";
  purchase_units: PayPalPurchaseUnit[];
  application_context?: {
    return_url?: string;
    cancel_url?: string;
    brand_name?: string;
    user_action?: "CONTINUE" | "PAY_NOW";
  };
}

export interface PayPalOrderResponse {
  id: string;
  status: "CREATED" | "SAVED" | "APPROVED" | "VOIDED" | "COMPLETED" | "PAYER_ACTION_REQUIRED";
  intent: string;
  purchase_units: Array<{
    reference_id: string;
    amount: PayPalAmount;
    payee?: {
      email_address?: string;
      merchant_id?: string;
    };
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: PayPalAmount;
        create_time: string;
      }>;
    };
  }>;
  create_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalPayoutItem {
  recipient_type: "EMAIL" | "PHONE" | "PAYPAL_ID";
  amount: {
    value: string;
    currency: string;
  };
  note?: string;
  sender_item_id: string;
  receiver: string;
  recipient_wallet?: "PAYPAL";
}

export interface PayPalCreatePayoutRequest {
  sender_batch_header: {
    sender_batch_id: string;
    email_subject?: string;
    email_message?: string;
  };
  items: PayPalPayoutItem[];
}

export interface PayPalPayoutBatchResponse {
  batch_header: {
    payout_batch_id: string;
    batch_status: "PENDING" | "PROCESSING" | "SUCCESS" | "DENIED" | "CANCELED";
    time_created: string;
    sender_batch_header: {
      sender_batch_id: string;
      email_subject?: string;
    };
    amount: {
      currency: string;
      value: string;
    };
  };
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalWebhookVerificationRequest {
  auth_algo: string;
  cert_url: string;
  transmission_id: string;
  transmission_sig: string;
  transmission_time: string;
  webhook_id: string;
  webhook_event: Record<string, any>;
}

export interface PayPalWebhookVerificationResponse {
  verification_status: "SUCCESS" | "FAILURE";
}
