import { PatreonClient } from './patreon/client';

export async function syncPatreonData() {
  const token = process.env.CREATOR_TOKEN;
  const campaignId = process.env.CREATOR_CAMPAIGN;

  if (!token || !campaignId) {
    throw new Error('Missing CREATOR_TOKEN or CREATOR_CAMPAIGN in environment');
  }

  const client = new PatreonClient(token, campaignId);
  console.log('Starting full Patreon data sync...');
  const data = await client.fetchAllMembers();
  console.log(`Sync complete. Fetched ${data.length} members.`);
  
  return data;
}
