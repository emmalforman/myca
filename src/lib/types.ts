export interface Member {
  id: string;
  notionId?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  linkedin?: string;
  company?: string;
  role?: string;
  occupationType?: string;
  location?: string;
  industryTags?: string;
  focusAreas?: string;
  superpower?: string;
  asks?: string;
  offers?: string;
  notes?: string;
  communities?: string;
  cohortTags?: string;
  warmth?: string;
  photoUrl?: string;
}

export interface ApplicationData {
  name: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  occupation: string;
  linkedin: string;
  email: string;
  phone: string;
  location: string[];
  comfortFood: string;
  hopingToGet: string;
  excitedToContribute: string;
  photo: File | null;
}

export interface Filters {
  search: string;
  location: string;
  occupation: string;
}

export const LOCATIONS = [
  "New York",
  "San Francisco",
  "London",
  "Los Angeles",
  "Chicago",
] as const;
