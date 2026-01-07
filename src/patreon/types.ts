export interface PatreonWebhookPayload {
  data: {
    id: string;
    type: string;
    attributes: {
      email?: string;
      full_name?: string;
      patron_status?: string | null;
      last_charge_status?: string | null;
      pledge_amount_cents?: number;
      // Add other attributes as needed
    };
    relationships?: {
      user?: {
        data: {
          id: string;
          type: string;
        };
      };
      currently_entitled_tiers?: {
        data: Array<{
          id: string;
          type: string;
        }>;
      };
    };
  };
  included?: any[];
}
