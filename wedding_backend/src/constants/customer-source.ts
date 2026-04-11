export const CUSTOMER_SOURCE_VALUES = [
  "facebook",
  "instagram",
  "tiktok",
  "google_search",
  "google_maps",
  "snapchat",
  "whatsapp",
  "friend_referral",
  "family_referral",
  "existing_customer",
  "walk_in",
  "advertisement",
  "exhibition",
  "website",
  "other",
] as const;

export type CustomerSource = (typeof CUSTOMER_SOURCE_VALUES)[number];
