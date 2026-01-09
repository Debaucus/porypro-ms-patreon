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
    is_follower: boolean;
    is_free_trial: boolean;
    is_gifted: boolean;
    next_charge_date: string | null;
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
    url: string;
  };
}

export interface PatreonTier {
  id: string;
  type: "tier";
  attributes: {
    title: string;
    amount_cents: number;
    description: string | null;
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

export interface ScanTiers {
  tier: string;
  scanners: number;
}

export const scannerTiers: ScanTiers[] = [
  { tier: "22667833", scanners: 0 },
  { tier: "22667844", scanners: 1 },
  { tier: "23548893", scanners: 1 },
  { tier: "23548931", scanners: 2 },
  { tier: "23548958", scanners: 3 },
  { tier: "23548990", scanners: 4 },
  { tier: "23549000", scanners: 5 },
  { tier: "23779295", scanners: 7 },
  { tier: "23779302", scanners: 10 },
];
