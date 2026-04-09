export type ApplicationStatus = "pending" | "approved" | "rejected";

export type Application = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  car: string | null;
  modifications: string | null;
  source: string | null;
  status: ApplicationStatus;
  created_at: string;
};

export type ApplicationFormData = {
  name: string;
  email: string;
  phone: string;
  instagram: string;
  car: string;
  modifications: string;
  source: string;
};

export type MemberTier = "Core" | "VIP" | "Strategic";
export type MemberStatus = "Active" | "Expired" | "Suspended";

export type Member = {
  id: string;
  name: string;
  email: string;
  car: string | null;
  tier: MemberTier;
  status: MemberStatus;
  joined_at: string;
};

export type EventType =
  | "Venue Activation"
  | "Night Run"
  | "Private Dinner"
  | "Collaboration"
  | "Special Event"
  | "Inner Circle";

export type Event = {
  id: string;
  name: string;
  date: string;
  time: string | null;
  location: string;
  type: EventType;
  capacity: number | null;
  rsvp_count: number;
  description: string | null;
  is_public: boolean;
  visibility: "public" | "members_only";
  created_at: string;
};

export type PerkCategory = "automotive" | "dining" | "lifestyle";

export type Perk = {
  id: string;
  business_name: string;
  category: PerkCategory;
  discount: string;
  description: string | null;
  discount_code: string | null;
  website_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};
