export interface Episode {
  episode_number: number;
  title: string;
  description?: string | null;
  duration_seconds?: number | null;
  languages: string[];
}

export interface Season {
  season_number: number;
  title?: string | null;
  episodes: Episode[];
}

export interface Show {
  id: number;
  title: string;
  slug: string;
  synopsis?: string | null;
  section?: string | null;
  category?: string | null;
  categories?: string[];
  poster?: string | null;
  banner?: string | null;
  thumbnail?: string | null;
  seasons: Season[];
}

export interface Section {
  name: string;
  shows: Show[];
}

export interface FeaturedShow {
  show_id: number;
  title: string;
  synopsis?: string | null;
  banner?: string | null;
}

export interface Catalogue {
  version: string;
  generated_at: string;
  featured?: FeaturedShow | null;
  sections: Section[];
}

export interface SearchResponse {
  count: number;
  shows: Show[];
}
