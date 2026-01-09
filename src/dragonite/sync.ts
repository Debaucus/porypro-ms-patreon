import { DragoniteClient } from "./client";
import { dragoniteStore } from "./store";

/**
 * Synchronizes Dragonite status data from the API to the in-memory store.
 */
export async function syncDragoniteData() {
  const url = process.env.DRAGONITE_API_URL;
  const secret = process.env.DRAGONITE_API_SECRET;

  if (!url || !secret) {
    console.warn(
      "Dragonite sync skipped: DRAGONITE_API_URL or DRAGONITE_API_SECRET missing in environment"
    );
    return null;
  }

  const client = new DragoniteClient(url, secret);
  try {
    console.log("Starting Dragonite status sync...");
    const data = await client.getStatus();
    dragoniteStore.setAreas(data.areas);
    console.log(`Dragonite sync complete. Stored ${data.areas.length} areas.`);
    return data;
  } catch (error: any) {
    console.error("Dragonite sync failed:", error.message);
    return null;
  }
}
