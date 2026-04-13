export interface Member {
  id: string;
  notionId?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  linkedin?: string;
  instagram?: string;
  substack?: string;
  company?: string;
  role?: string;
  occupationType?: string;
  location?: string;
  industryTags?: string;
  focusAreas?: string;
  skills?: string;
  interests?: string;
  superpower?: string;
  asks?: string;
  offers?: string;
  notes?: string;
  communities?: string;
  cohortTags?: string;
  warmth?: string;
  photoUrl?: string;
  createdAt?: string;
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
  locations: string[];
  occupations: string[];
  companies: string[];
}

export interface Event {
  id: string;
  title: string;
  host?: string;
  hostCompany?: string;
  description?: string;
  date: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  city?: string;
  rsvpUrl?: string;
  rsvpPlatform?: string;
  coverImageUrl?: string;
  source?: string;
  sourceEventId?: string;
  submittedByName?: string;
  submittedByEmail?: string;
  isMycaMemberEvent?: boolean;
  isFeatured?: boolean;
  status?: string;
  personalNote?: string;
  newsletterIncluded?: boolean;
  createdAt?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  locationType?: string;
  type?: string;
  description: string;
  applyUrl?: string;
  applyEmail?: string;
  salaryRange?: string;
  submittedByName?: string;
  submittedByEmail?: string;
  contactName?: string;
  contactEmail?: string;
  status?: string;
  createdAt?: string;
}

export const JOB_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "freelance",
  "internship",
] as const;

export const LOCATION_TYPES = ["onsite", "remote", "hybrid"] as const;

export const LOCATIONS = [
  "New York",
  "San Francisco",
  "London",
  "Los Angeles",
  "Chicago",
] as const;
