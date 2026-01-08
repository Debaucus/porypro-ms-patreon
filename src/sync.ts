import { PatreonClient } from './patreon/client';
import { store } from "./store";

export async function syncPatreonData() {
  const token = process.env.CREATOR_TOKEN;
  const campaignId = process.env.CREATOR_CAMPAIGN;

  if (!token || !campaignId) {
    throw new Error("Missing CREATOR_TOKEN or CREATOR_CAMPAIGN in environment");
  }

  const client = new PatreonClient(token, campaignId);
  console.log("Starting full Patreon data sync...");
  const data = await client.fetchAllMembers();

  store.setMembers(data);

  console.log(`Sync complete. Fetched and stored ${data.length} members.`);

  return data;
}
