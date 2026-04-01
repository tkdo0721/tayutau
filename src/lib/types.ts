export interface Post {
  id: string;
  text: string;
  lat: number;
  lng: number;
  created_at: string;
  distance_m?: number;
  device_id?: string;
  reach_count?: number;
  view_count?: number;
}

export interface Comment {
  id: string;
  post_id: string;
  text: string;
  lat: number;
  lng: number;
  created_at: string;
  distance_m?: number;
  device_id?: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface PostAnalytics {
  post_id: string;
  reach: { total: number; unique: number };
  view: { total: number; unique: number };
  conversion_rate: number;
  by_hour: number[];
  by_day: number[];
  peak_hour: number;
}
