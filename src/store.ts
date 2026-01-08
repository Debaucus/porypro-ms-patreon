export interface MemberData {
  id: string;
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
}

class MemberStore {
  private members: Map<string, MemberData> = new Map();

  setMembers(members: MemberData[]) {
    this.members.clear();
    members.forEach(m => this.members.set(m.id, m));
  }

  upsertMember(member: MemberData) {
    this.members.set(member.id, member);
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
