import { DragoniteArea, DragoniteStatusData } from './types';

/**
 * In-memory store for Dragonite status data.
 * Mirrors the structure and behavior of the Patreon MemberStore.
 */
class DragoniteStore {
  private areas: Map<number, DragoniteArea> = new Map();
  private lastUpdated: number = 0;

  /**
   * Updates the store with a new set of areas.
   * Resets the store and replaces all data with the new areas.
   */
  setAreas(areas: DragoniteArea[]) {
    this.lastUpdated = Date.now();
    this.areas.clear();
    areas.forEach((area) => {
      this.areas.set(area.id, area);
    });
  }

  /**
   * Retrieves a single area by its ID.
   */
  getArea(id: number) {
    return this.areas.get(id);
  }

  /**
   * Retrieves all areas currently in the store.
   */
  getAllAreas() {
    return Array.from(this.areas.values());
  }

  /**
   * Returns the stored data in the format of DragoniteStatusData.
   */
  getStatusData(): DragoniteStatusData {
    return {
      areas: this.getAllAreas(),
    };
  }

  /**
   * Returns the timestamp (ms) of the last update.
   */
  getLastUpdated() {
    return this.lastUpdated;
  }

  /**
   * Returns the total count of areas.
   */
  getAreaCount() {
    return this.areas.size;
  }

  /**
   * Aggregates stats across all areas and workers.
   */
  getStats() {
    let totalWorkers = 0;
    let activeWorkers = 0;
    
    this.areas.forEach(area => {
      area.worker_managers.forEach(manager => {
        totalWorkers += manager.expected_workers;
        activeWorkers += manager.active_workers;
      });
    });

    return {
      areaCount: this.areas.size,
      totalWorkers,
      activeWorkers,
      lastUpdated: this.lastUpdated
    };
  }
}

export const dragoniteStore = new DragoniteStore();
