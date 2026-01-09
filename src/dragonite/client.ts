import {
  DragoniteTypes,
  DragoniteStatusResponse,
  DragoniteStatusData,
} from "./types";

export class DragoniteClient {
  private url: string;
  private secret: string;

  constructor(url: string, secret: string) {
    this.url = url.endsWith("/") ? url.slice(0, -1) : url;
    this.secret = secret;
  }

  /**
   * Fetches the status of the Dragonite instance.
   * Endpoint: /api/status/
   */
  async getStatus(): Promise<DragoniteStatusData> {
    const endpoint = `${this.url}/api/status/`;
    const response = await fetch(endpoint, {
      headers: {
        Cookie: `authorized=${this.secret}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dragonite API error: ${response.status} ${errorText}`);
    }

    const json = (await response.json()) as
      | DragoniteStatusResponse
      | DragoniteStatusData;

    // Handle wrapped response: { "success": true, "data": { "areas": [...] } }
    if ("success" in json && json.success === true && json.data) {
      return json.data;
    }

    // Handle direct response: { "areas": [...] }
    if ("areas" in json) {
      return json;
    }

    throw new Error(
      `Dragonite API returned unexpected format: ${JSON.stringify(json)}`
    );
  }

  /**
   * Fetches details for a single area.
   * Endpoint: /api/areas/{id}
   */
  async getArea(id: number): Promise<{ name: string; [key: string]: any }> {
    const endpoint = `${this.url}/api/areas/${id}`;
    const response = await fetch(endpoint, {
      headers: {
        Cookie: `authorized=${this.secret}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dragonite API error: ${response.status} ${errorText}`);
    }

    const json = await response.json();
    return json.data || json;
  }
}
