import { PatreonWebhookPayload } from './patreon/types';
import { store, MemberData } from "./store";

export async function handleWebhookEvent(
  event: string,
  payload: PatreonWebhookPayload
) {
  const member = payload.data;
  const attributes = member.attributes;
  const email = attributes.email;

  console.log(`Received event: ${event} for ${email || "unknown user"}`);

  const mappedMember: MemberData = {
    id: member.id,
    patreonId: member.relationships?.user?.data?.id || null, // Webhooks often send the numeric ID as the user.data.id
    email: attributes.email,
    fullName: attributes.full_name,
    status: attributes.patron_status,
    amountCents: attributes.currently_entitled_amount_cents,
    discordId: null, // Basic webhook doesn't include social_connections by default, would need extra fetch if required
    lastChargeStatus: attributes.last_charge_status,
    isFollower: attributes.is_follower,
    isFreeTrial: attributes.is_free_trial,
    isGifted: attributes.is_gifted,
    nextChargeDate: attributes.next_charge_date,
    lastUpdated: Date.now(),
    tiers: (member.relationships?.currently_entitled_tiers?.data || []).map(
      (t: any) => ({
        id: t.id,
        title: `Tier ${t.id}`, // Placeholder since titles aren't always in webhooks
      })
    ),
  };

  switch (event) {
    case "members:pledge:create":
    case "members:create":
      console.log("User joined or started a pledge. Updating store...");
      store.upsertMember(mappedMember);
      break;

    case "members:pledge:update":
    case "members:update":
      console.log("Pledge or member updated. Syncing store...");
      store.upsertMember(mappedMember);
      break;

    case "members:pledge:delete":
    case "members:delete":
      console.log("Pledge cancelled or member deleted. Removing from store...");
      store.removeMember(member.id);
      break;

    default:
      console.warn(`Unhandled event type: ${event}`);
  }
}
