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
