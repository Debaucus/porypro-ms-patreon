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
}

export const store = new MemberStore();
