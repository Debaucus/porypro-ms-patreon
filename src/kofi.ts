export interface KofiMember {
  /** The Discord ID of the Ko-Fi supporter. */
  discordId: string;
  /** Full name of the supporter. */
  fullName: string;
  /** The number of scanners they are allowed to have. */
  allowedScanners: number;
}

/**
 * Hard-coded list of Ko-Fi supporters.
 * Add members here manually since Ko-Fi lacks a public API for this.
 */
export const kofiMembers: KofiMember[] = [
  // Example entry:
  // { discordId: "123456789012345678", fullName: "Ko-Fi Supporter", allowedScanners: 2 }
  { discordId: "884905804757622835", fullName: "swollywoood", allowedScanners: 1 },
  { discordId: "", fullName: "", allowedScanners: 0 },
];
