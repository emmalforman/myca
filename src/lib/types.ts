export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  title?: string;
  company?: string;
  occupation?: string;
  location: string[];
  linkedin?: string;
  comfortFood?: string;
  hopingToGet?: string;
  excitedToContribute?: string;
  asksAndOffers?: string;
  attendedEvents?: string[];
  joinedDate?: string;
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
  "New York 🗽",
  "San Francisco 🌉",
  "London 🇬🇧",
  "Los Angeles 🎬",
  "Chicago 🍕",
  "Other",
] as const;
