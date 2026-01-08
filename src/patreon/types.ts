export interface PatreonMember {
  id: string;
  type: "member";
  attributes: {
    email: string;
    full_name: string;
    patron_status: string | null;
    currently_entitled_amount_cents: number;
    last_charge_date: string | null;
    last_charge_status: string | null;
    lifetime_support_cents: number;
    will_pay_amount_cents: number;
  };
  relationships: {
    user?: {
      data: {
        id: string;
        type: "user";
      };
    };
    currently_entitled_tiers?: {
      data: Array<{
        id: string;
        type: "tier";
      }>;
    };
  };
}

export interface PatreonUser {
  id: string;
  type: "user";
  attributes: {
    social_connections: {
      discord: {
        user_id: string;
      } | null;
    };
  };
}

export interface PatreonCollectionResponse<T> {
  data: T[];
  included?: any[];
  links?: {
    next?: string;
  };
  meta: {
    pagination: {
      total: number;
    };
  };
}

export interface PatreonWebhookPayload {
  data: PatreonMember;
  included?: any[];
}
