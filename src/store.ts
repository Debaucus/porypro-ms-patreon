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

    let totalScanners = 0;
    let activePatronCount = 0;

    for (const member of this.members.values()) {
      if (member.status === "active_patron") {
        activePatronCount++;
        member.tiers.forEach((t) => {
          totalScanners += scannerTiers[t.id] || 0;
        });
      }
    }

    return {
      totalScanners,
      activePatronCount,
      totalMembers: this.members.size,
    };
  }
}

export const store = new MemberStore();
