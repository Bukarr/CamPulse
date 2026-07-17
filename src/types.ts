export type UserRole = 'student' | 'admin' | 'technician';

export interface User {
  id: string;
  google_id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type ReportCategory = 'broken_lights' | 'plumbing' | 'wifi_outage' | 'security' | 'structural' | 'others';

export type ReportStatus = 'submitted' | 'assigned' | 'in_progress' | 'resolved';

export interface Report {
  id: string;
  reporter_id: string;
  reporter_name?: string;
  category: ReportCategory;
  description: string;
  photo_url?: string;
  lat: number;
  lng: number;
  zone_id: string;
  zone_name?: string;
  status: ReportStatus;
  priority_score: number; // 1 (low) to 5 (critical)
  is_anonymous: boolean;
  upvotes: number;
  upvoted_by?: string[]; // user IDs
  created_at: string;
  comments_count?: number;
  gemma_rank_score?: number;
  voice_url?: string;
  voice_interpretation?: string;
  assigned_technician_id?: string;
  assigned_technician_name?: string;
}

export interface Technician {
  id: string;
  user_id: string;
  name: string;
  email: string;
  skill_tags: string[];
  current_load: number;
}

export interface Assignment {
  id: string;
  report_id: string;
  technician_id: string;
  assigned_at: string;
  resolved_at?: string;
  technician_name?: string;
}

export interface Comment {
  id: string;
  report_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  text: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'status_change' | 'new_assignment' | 'high_priority';
  reference_id: string;
  read: boolean;
  created_at: string;
}

export interface AbuZone {
  id: string;
  name: string;
  description: string;
  coordinates: [number, number][]; // Polygon coordinates
  color: string;
  category?: string;
}

export interface OfflineReportQueueItem {
  tempId: string;
  category: ReportCategory;
  description: string;
  photo_url?: string;
  lat: number;
  lng: number;
  is_anonymous: boolean;
  created_at: string;
}

export interface OfflineAction {
  id: string;
  type: 'assign' | 'status_change';
  reportId: string;
  payload: any;
  created_at: string;
}

