import { DragoniteTypes } from './types';

export interface DragoniteStatus {
  // TBD: User needs to provide example response
  [key: string]: any;
}

export class DragoniteClient {
  private url: string;
  private secret: string;

  constructor(url: string, secret: string) {
    this.url = url.endsWith('/') ? url.slice(0, -1) : url;
    this.secret = secret;
  }

  /**
   * Fetches the status of the Dragonite instance.
   * Endpoint: /api/status/
   */
  async getStatus(): Promise<DragoniteStatus> {
    const endpoint = `${this.url}/api/status/`;
    const response = await fetch(endpoint, {
      headers: {
        'Cookie': `authorized=${this.secret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dragonite API error: ${response.status} ${errorText}`);
    }

    return await response.json() as DragoniteStatus;
  }

  /**
   * Placeholder for future endpoints that use DragoniteTypes
   */
  async getDragoniteDetails(id: number): Promise<DragoniteTypes> {
    // Example implementation for a hypothetical endpoint
    const endpoint = `${this.url}/api/dragonite/${id}`;
    const response = await fetch(endpoint, {
      headers: {
        'Cookie': `authorized=${this.secret}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dragonite API error: ${response.status} ${errorText}`);
    }

    return await response.json() as DragoniteTypes;
  }
}
