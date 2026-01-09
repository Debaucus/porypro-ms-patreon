/**
 * Represents the configuration and state of a Dragonite instance.
 */
export interface DragoniteTypes extends Record<string, unknown> {
  /** The name of the Dragonite instance. */
  name: string;
  /** Whether the instance is currently enabled. */
  enabled: boolean | number;
  /** Configuration for Pokemon scanning mode. */
  pokemon_mode: PokemonMode;
  /** Configuration for Quest collection mode. */
  quest_mode: QuestMode;
  /** Configuration for Fort/Gym interaction mode. */
  fort_mode: FortMode;
  /** List of geographic points defining the service area. */
  geofence: Geofence[];
  /** Whether quest collection is globally enabled for this instance. */
  enable_quests: boolean | number;
  /** Unique identifier for the instance. */
  id: number;
}

/**
 * Configuration for Fort/Gym interaction mode.
 */
export interface FortMode {
  /** Number of worker threads assigned to this mode. */
  workers: number;
  /** The current active route for forts. */
  route: [];
  /** The full calculated route for all forts in the area. */
  full_route: [];
  /** Whether to prioritize raid-active forts. */
  prio_raid: boolean;
  /** Whether to interact with Showcases. */
  showcase: boolean;
  /** Whether to handle Team GO Rocket invasions. */
  invasion: boolean;
}

/**
 * Represents a geographic coordinate.
 */
export interface Geofence {
  /** Latitude coordinate. */
  lat: number;
  /** Longitude coordinate. */
  lon: number;
}

/**
 * Configuration for Pokemon scanning mode.
 */
export interface PokemonMode {
  /** Number of worker threads assigned to this mode. */
  workers: number;
  /** The route to follow, either an array of coordinates or a encoded string. */
  route: Geofence[] | string;
  /** Whether scout mode is enabled for rare spawns. */
  enable_scout: boolean;
  /** Whether to handle Team GO Rocket invasions in this mode. */
  invasion: boolean;
}

/**
 * Configuration for Quest collection mode.
 */
export interface QuestMode {
  /** Number of worker threads assigned to this mode. */
  workers: number;
  /** The route to follow for quest collection. */
  route: Geofence[] | string;
  /** Allowed operating hours for this mode. */
  hours: number[];
  /** Maximum number of accounts in the login queue. */
  max_login_queue: number;
}

/**
 * Default values for a new Dragonite instance.
 */
export const defaultDragoniteDetails: DragoniteTypes = {
  name: "",
  enabled: false,
  pokemon_mode: {
    workers: 0,
    route: [],
    enable_scout: false,
    invasion: false,
  },
  quest_mode: {
    workers: 0,
    hours: [1, 10],
    max_login_queue: 0,
    route: [],
  },
  fort_mode: {
    workers: 0,
    route: [],
    full_route: [],
    prio_raid: false,
    showcase: false,
    invasion: false,
  },
  geofence: [],
  enable_quests: false,
  id: 0,
};
