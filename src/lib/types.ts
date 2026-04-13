export type Domain =
  | "AI"
  | "CV & Multimedia"
  | "Systems"
  | "Networking"
  | "Security"
  | "Data"
  | "SE & PL"
  | "Theory"
  | "HCI"
  | "Graphics & AR"
  | "Interdisciplinary";
export type CoreRank = "A*" | "A" | "B" | "C" | "Unranked";
export type Organizer = "ACM" | "IEEE" | "Other";
export type Urgency = "safe" | "soon" | "urgent" | "critical" | "expired";

export interface Conference {
  title: string;
  full_name: string;
  rank_core: CoreRank;
  is_csrankings: boolean;
  organizer: Organizer;
  link: string;
  deadlines: {
    abstract?: string;
    full_paper: string;
  };
  timezone: string;
  place: string;
  date: string;
  domains: Domain[];
  open_access?: boolean;
  artifact_badge?: boolean;
}

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  urgency: Urgency;
  expired: boolean;
}

export interface FilterState {
  search: string;
  domain: Domain | "All";
  rank: CoreRank | "All";
  organizer: Organizer | "All";
  csrankings_only: boolean;
}
