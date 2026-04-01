export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  title?: string;
  company?: string;
  location?: string;
  industry?: string;
  bio?: string;
  tags: string[];
  linkedin?: string;
  twitter?: string;
  website?: string;
  joinedDate?: string;
}

export interface Filters {
  search: string;
  industry: string;
  location: string;
  tags: string[];
}
