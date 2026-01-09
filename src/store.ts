import { DragoniteArea } from "./dragonite/types";
import { kofiMembers } from "./kofi";
import { uuidToPatreonId } from "./mappings";
import { DragoniteClient } from "./dragonite/client";

export interface MemberData {
  id: string;
  patreonId: string | null;
  email: string;
  fullName: string;
  status: string | null;
  amountCents: number;
  discordId: string | null;
  lastChargeStatus: string | null;
  isFollower: boolean;
  isFreeTrial: boolean;
  isGifted: boolean;
  nextChargeDate: string | null;
  lastUpdated: number; // Unix timestamp
  tiers: Array<{
    id: string;
    title: string;
  }>;
}

class MemberStore {
  private members: Map<string, MemberData> = new Map();

  setMembers(members: MemberData[]) {
    members.forEach((m) => this.upsertMember(m));
  }

  /**
   * Only updates if the new data is newer or equal to the existing data.
   */
  upsertMember(member: MemberData) {
    const existing = this.members.get(member.id);
    if (!existing || member.lastUpdated >= existing.lastUpdated) {
      this.members.set(member.id, member);
      return true;
    }
    return false;
  }

  /**
   * Removes members that weren't updated in the latest sync.
   * Logic: If a member's lastUpdated is strictly less than the current syncStartTime,
   * it means they weren't in the latest pull and should be removed.
   */
  purgeStale(syncStartTime: number) {
    for (const [id, member] of this.members.entries()) {
      if (member.lastUpdated < syncStartTime) {
        this.members.delete(id);
      }
    }
  }

  removeMember(id: string) {
    this.members.delete(id);
  }

  getMember(id: string) {
    return this.members.get(id);
  }

  getAll() {
    return Array.from(this.members.values());
  }

  getCount() {
    return this.members.size;
  }

  getScannerStats() {
    const scannerTiers: Record<string, number> = {
      "22667833": 0,
      "22667844": 1,
      "23548893": 1,
      "23548931": 2,
      "23548958": 3,
      "23548990": 4,
      "23549000": 5,
      "23779295": 7,
      "23779302": 10,
    };

    let patreonScannersTotal = 0;
    let activePatronCount = 0;

    for (const member of this.members.values()) {
      if (member.status === "active_patron") {
        activePatronCount++;
        member.tiers.forEach((t) => {
          patreonScannersTotal += scannerTiers[t.id] || 0;
        });
      }
    }

    const kofiScannersTotal = kofiMembers.reduce(
      (sum, k) => sum + k.allowedScanners,
      0
    );
    const activeKofiCount = kofiMembers.length;

    return {
      totalScanners: patreonScannersTotal + kofiScannersTotal,
      patreonScannersTotal,
      kofiScannersTotal,
      activePatronCount,
      activeKofiCount,
      totalMembers: this.members.size + activeKofiCount,
    };
  }

  async getComparisonStats(
    dragoniteAreas: DragoniteArea[],
    dragoniteClient?: DragoniteClient
  ) {
    const scannerTiers: Record<string, number> = {
      "22667833": 0,
      "22667844": 1,
      "23548893": 1,
      "23548931": 2,
      "23548958": 3,
      "23548990": 4,
      "23549000": 5,
      "23779295": 7,
      "23779302": 10,
    };

    const results = {
      completed: [] as any[],
      matches: [] as any[],
      noPatreonMatch: {
        enabled: [] as any[],
        disabled: [] as any[],
      },
      noDiscordIdFound: {
        enabled: [] as any[],
        disabled: [] as any[],
      },
      noDragoniteMatch: [] as any[],
      possibles: {
        nameMatches: [] as any[],
        usernameAudit: {
          enabled: [] as any[],
          disabled: [] as any[],
        },
        uniqueDragoniteUuids: [] as string[],
      },
    };

    // 1. Live Name Verification for Enabled Areas
    if (dragoniteClient) {
      console.log(
        "Performing live area name verification for enabled areas..."
      );
      const enabledAreas = dragoniteAreas.filter((a) => a.enabled);

      await Promise.all(
        enabledAreas.map(async (area) => {
          try {
            const liveArea = await dragoniteClient.getArea(area.id);
            if (liveArea && liveArea.name && liveArea.name !== area.name) {
              console.log(
                `[LiveSync] Area ${area.id} name replaced: "${area.name}" -> "${liveArea.name}"`
              );
              area.name = liveArea.name;
            }
          } catch (error: any) {
            console.warn(
              `[LiveSync] Failed to fetch area ${area.id}: ${error.message}`
            );
          }
        })
      );
    }

    // Index members by Discord ID and Patreon ID for faster lookup
    const membersByDiscordId = new Map<string, MemberData>();
    const membersByPatreonId = new Map<string, MemberData>();
    for (const member of this.members.values()) {
      if (member.status === "active_patron") {
        if (member.discordId) {
          membersByDiscordId.set(member.discordId, member);
        }
        if (member.patreonId) {
          membersByPatreonId.set(member.patreonId, member);
        }
      }
    }

    const kofiByDiscordId = new Map<string, any>();
    kofiMembers.forEach((k) => kofiByDiscordId.set(k.discordId, k));

    // Process Dragonite Areas
    const areaMapByDiscordId = new Map<string, any[]>();
    const completedDiscordIds = new Set<string>();
    const uniqueUuidSet = new Set<string>();
    const uuidRegex =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

    dragoniteAreas.forEach((area) => {
      // Collect unique UUIDs from ALL areas
      const uuidMatch = area.name.match(uuidRegex);
      if (uuidMatch) uniqueUuidSet.add(uuidMatch[0]);

      // 0. Patreon ID Prefix Match (Highest Confidence)
      const patreonIdPrefixMatch = area.name.match(/^(\d+)/);
      if (patreonIdPrefixMatch) {
        const patreonId = patreonIdPrefixMatch[1];
        const member = membersByPatreonId.get(patreonId);
        if (member && member.discordId) {
          if (!areaMapByDiscordId.has(member.discordId)) {
            areaMapByDiscordId.set(member.discordId, []);
          }
          areaMapByDiscordId.get(member.discordId)?.push(area);
          completedDiscordIds.add(member.discordId);
          return;
        }
      }

      // 0.5. Ko-Fi Prefix Match (Highest Confidence for Ko-Fi)
      if (area.name.toLowerCase().startsWith("kofi")) {
        const discordIdMatch = area.name.match(/(\d{17,20})/);
        if (discordIdMatch) {
          const discordId = discordIdMatch[1];
          const kofi = kofiByDiscordId.get(discordId);
          if (kofi) {
            if (!areaMapByDiscordId.has(discordId)) {
              areaMapByDiscordId.set(discordId, []);
            }
            areaMapByDiscordId.get(discordId)?.push(area);
            completedDiscordIds.add(discordId);
            return;
          }
        }
      }

      // 1. Try Discord ID Match (17-20 digits)
      const discordIdMatch = area.name.match(/(\d{17,20})/);
      if (discordIdMatch) {
        const discordId = discordIdMatch[1];
        if (!areaMapByDiscordId.has(discordId)) {
          areaMapByDiscordId.set(discordId, []);
        }
        areaMapByDiscordId.get(discordId)?.push(area);

        // Also check for UUIDs inside names with IDs
        const uuidMatch = area.name.match(uuidRegex);
        if (uuidMatch) uniqueUuidSet.add(uuidMatch[0]);
        return;
      }

      // 1.5. Resolve via UUID Mapping
      if (uuidMatch) {
        const uuid = uuidMatch[0];
        const mappedPatreonId = uuidToPatreonId[uuid];
        if (mappedPatreonId) {
          const member = membersByPatreonId.get(mappedPatreonId);
          if (member && member.discordId) {
            // Treat as a primary match using the member's Discord ID
            if (!areaMapByDiscordId.has(member.discordId)) {
              areaMapByDiscordId.set(member.discordId, []);
            }
            areaMapByDiscordId.get(member.discordId)?.push(area);
            return;
          }
        }
      }

      // 2. Secondary Check: Ko-Fi Name Match (Heuristic) - Move to possibles
      const kofiNameMatch = kofiMembers.find((km) =>
        area.name.toLowerCase().includes(km.fullName.toLowerCase())
      );
      if (kofiNameMatch) {
        results.possibles.nameMatches.push({
          areaId: area.id,
          areaName: area.name,
          enabled: area.enabled,
          matchedKofiName: kofiNameMatch.fullName,
          discordId: kofiNameMatch.discordId,
        });
      }

      // 3. Primary categorization: No Discord ID Found
      if (area.enabled) {
        results.noDiscordIdFound.enabled.push(area);
      } else {
        results.noDiscordIdFound.disabled.push(area);
      }

      // 4. Secondary categorization: Username Audit (Non-UUIDs without Discord ID)
      if (!uuidMatch) {
        if (area.enabled) {
          results.possibles.usernameAudit.enabled.push(area);
        } else {
          // Remove disabled areas from username audit
          //results.possibles.usernameAudit.disabled.push(area);
        }
      }
    });

    results.possibles.uniqueDragoniteUuids = Array.from(uniqueUuidSet);

    // Analyze Matches and Mismatches
    const matchedPatreonDiscordIds = new Set<string>();

    for (const [discordId, areas] of areaMapByDiscordId.entries()) {
      const member = membersByDiscordId.get(discordId);

      const totalExpectedWorkers = areas.reduce((sum, area) => {
        return (
          sum +
          area.worker_managers.reduce(
            (mSum: number, m: any) => mSum + m.expected_workers,
            0
          )
        );
      }, 0);

      const areaSummary = {
        discordId,
        totalExpectedWorkers,
        enabled: areas.some((a) => a.enabled),
        areas: areas.map((a: any) => ({
          id: a.id,
          name: a.name,
          enabled: a.enabled,
        })),
      };

      const kofi = kofiByDiscordId.get(discordId);

      if (member || kofi) {
        // Calculate allowed scanners from either source
        let allowedScanners = 0;
        let name = "";
        let source = "";
        let patreonId = null;

        if (member) {
          member.tiers.forEach((t) => {
            allowedScanners += scannerTiers[t.id] || 0;
          });
          name = member.fullName;
          source = "Patreon";
          patreonId = member.patreonId;
        } else if (kofi) {
          allowedScanners = kofi.allowedScanners;
          name = kofi.fullName;
          source = "Ko-Fi";
        }

        const isMismatch = totalExpectedWorkers !== allowedScanners;
        const resultEntry = {
          ...areaSummary,
          name,
          source,
          patreonId,
          allowedScanners,
          isMismatch,
          mismatchAndEnabled: isMismatch && areaSummary.enabled,
        };

        if (completedDiscordIds.has(discordId)) {
          results.completed.push(resultEntry);
        } else {
          results.matches.push(resultEntry);
        }
        matchedPatreonDiscordIds.add(discordId);
      } else {
        if (areaSummary.enabled) {
          results.noPatreonMatch.enabled.push(areaSummary);
        } else {
          results.noPatreonMatch.disabled.push(areaSummary);
        }
      }
    }

    // Find Patreon members with no matching Dragonite area
    for (const [discordId, member] of membersByDiscordId.entries()) {
      if (!matchedPatreonDiscordIds.has(discordId)) {
        let allowedScanners = 0;
        member.tiers.forEach((t) => {
          allowedScanners += scannerTiers[t.id] || 0;
        });

        results.noDragoniteMatch.push({
          discordId,
          patreonId: member.patreonId,
          name: member.fullName,
          source: "Patreon",
          allowedScanners,
        });
      }
    }

    // Find Ko-Fi members with no matching Dragonite area
    for (const [discordId, kofi] of kofiByDiscordId.entries()) {
      if (!matchedPatreonDiscordIds.has(discordId)) {
        results.noDragoniteMatch.push({
          discordId,
          patreonId: null,
          name: kofi.fullName,
          source: "Ko-Fi",
          allowedScanners: kofi.allowedScanners,
        });
      }
    }

    return results;
  }
}

export const store = new MemberStore();
