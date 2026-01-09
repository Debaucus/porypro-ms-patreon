import { PatreonCollectionResponse, PatreonMember, PatreonUser } from './types';

export class PatreonClient {
  private token: string;
  private campaignId: string;
  private baseUrl = "https://www.patreon.com/api/oauth2/v2";
  private pageCount = 1;

  constructor(token: string, campaignId: string) {
    this.token = token;
    this.campaignId = campaignId;
  }

  async fetchAllMembers() {
    let allMembers: any[] = [];
    let nextUrl:
      | string
      | undefined = `${this.baseUrl}/campaigns/${this.campaignId}/members?include=user,currently_entitled_tiers&fields%5Bmember%5D=email,full_name,patron_status,currently_entitled_amount_cents,last_charge_date,last_charge_status,lifetime_support_cents,will_pay_amount_cents,is_follower,is_free_trial,is_gifted,next_charge_date&fields%5Buser%5D=social_connections&fields%5Btier%5D=title,amount_cents`;

    while (nextUrl) {
      console.log(`Fetching Patreon Data - Current Page: ${this.pageCount}`);
      this.pageCount++;
      const response = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Patreon API error: ${response.status} ${errorText}`);
      }

      const payload: PatreonCollectionResponse<PatreonMember> =
        await response.json();

      const members = this.processResponse(payload);
      allMembers = allMembers.concat(members);

      nextUrl = payload.links?.next;
    }

    return allMembers;
  }

  private processResponse(payload: PatreonCollectionResponse<PatreonMember>) {
    const includedUsers = new Map<string, PatreonUser>();
    const includedTiers = new Map<string, any>();

    payload.included?.forEach((item: any) => {
      if (item.type === "user") {
        includedUsers.set(item.id, item as PatreonUser);
      } else if (item.type === "tier") {
        includedTiers.set(item.id, item);
      }
    });

    return payload.data.map((member) => {
      const userId = member.relationships.user?.data.id;
      const user = userId ? includedUsers.get(userId) : null;
      const discordId =
        user?.attributes.social_connections.discord?.user_id || null;

      // Extract numeric Patreon ID from the user URL (e.g. ?u=12345678)
      let patreonId = userId; // Fallback to raw ID
      if (user?.attributes.url) {
        const urlMatch = user.attributes.url.match(/[?&]u=(\d+)/);
        if (urlMatch) {
          patreonId = urlMatch[1];
        }
      }

      // Extract tiers
      const tiers = (
        member.relationships.currently_entitled_tiers?.data || []
      ).map((t) => {
        const tier = includedTiers.get(t.id);
        return {
          id: t.id,
          title: tier?.attributes.title || "Unknown Tier",
        };
      });

      return {
        id: member.id, // This is the Member UUID
        patreonId: patreonId, // This is the numeric User ID
        email: member.attributes.email,
        fullName: member.attributes.full_name,
        status: member.attributes.patron_status,
        amountCents: member.attributes.currently_entitled_amount_cents,
        discordId: discordId,
        lastChargeStatus: member.attributes.last_charge_status,
        isFollower: member.attributes.is_follower,
        isFreeTrial: member.attributes.is_free_trial,
        isGifted: member.attributes.is_gifted,
        nextChargeDate: member.attributes.next_charge_date,
        tiers: tiers,
      };
    });
  }
}
