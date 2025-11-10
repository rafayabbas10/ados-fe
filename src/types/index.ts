export interface AdAccount {
  id: string;
  facebook_account_id: string;
  account_name: string;
  currency: string;
  timezone: string;
  status: 'ACTIVE' | 'PAUSED' | 'DISABLED';
  created_at: string;
  report_count?: number;
  last_audit_date?: string;
  total_spend?: number;
  avg_roas?: number;
}

export interface AuditReport {
  id: number;
  account_id: string;
  from_date: string;
  to_date: string;
  created_at: string;
  status: 'processing initiated' | 'ad analysis complete' | 'ad blocks created' | 'summary created' | 'complete' | 'processing' | 'failed';
}

export interface Ad {
  id: string;
  facebook_ad_id: string;
  ad_name: string;
  ad_link?: string;
  performance?: AdPerformance;
  video_metrics?: VideoMetrics;
  analysis?: AdAnalysis;
  // Legacy fields for backward compatibility
  account_id?: string;
  ad_group_id?: string;
  creative_name?: string;
  creative_id?: string;
  status?: 'ACTIVE' | 'PAUSED' | 'DISABLED';
  is_group_representative?: boolean;
  date_start?: string;
  date_end?: string;
  video_url?: string;
  thumbnail_url?: string;
  facebook_url?: string;
}

export interface ReportAd {
  id?: string;
  facebook_ad_id?: string;
  name: string;
  link?: string;
  spend: number;
  roas: number;
  aov: number;
  thumbstop: number;
  hold_rate: number;
  ctr: number;
  cpa: number;
  ad_video_link?: string;
  ad_type: string;
  status?: 'ACTIVE' | 'PAUSED' | 'DISABLED';
  is_group_representative?: boolean;
}

export interface ReportSummary {
  id: number;
  created_at: string;
  audit_id: number;
  psychological_triggers: string;
  paint_points: string;
  tonality: string;
  visuals: string;
  market_awareness: string;
  angle: string;
  format: string;
  theme: string;
  recomendations: string;
}

export interface AdPerformance {
  id: string;
  ad_id: string;
  spend: number;
  roas: number;
  roas_status: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
  aov: number;
  impressions: number;
  clicks: number;
  reach: number;
  views?: number;
  ctr: number;
  cpc: number;
  cpm: number;
  cpa: number;
  purchases: number;
  purchase_value: number;
  thumbstop?: number;
  thumbstop_rate?: number;
  hold_rate?: number;
  ctr_outbound?: number;
  click_to_purchase?: number;
}

export interface VideoMetrics {
  id: string;
  ad_id: string;
  thumbstop_rate: number;
  hold_rate: number;
  total_video_views: number;
  retention_25: number;
  retention_50: number;
  retention_75: number;
  retention_95: number;
  retention_100: number;
  thruplay: number;
}

export interface AdAnalysis {
  id: string;
  ad_id: string;
  translation?: string;
  hook_headline?: string;
  hook_reason?: string;
  psychological_triggers: string[];
  pain_points: string[];
  tonality?: string;
  converting_phrases: string[];
  visuals_that_helped: string[];
  market_awareness?: string;
  avatar?: string;
  angle?: string;
  format?: string;
  theme?: string;
  elements_to_double_down: string[];
  video_drive_link?: string;
  video_content_link?: string;
  breakdown_sheet_link?: string;
  visual_style?: string;
  color_scheme?: string;
  music_style?: string;
  performance_insights?: string;
  recommendations?: string[];
}

export interface VideoScene {
  id: number;
  audit_ad_id: number;
  scene: number;
  timestamp: string;
  script?: string;
  visual?: string;
  visual_elements?: string;
  text_overlay?: string;
  shot_type?: string;
  value_block_type?: string;
  created_at?: string;
  screenshot_url?: string;
  thumbnail_url?: string;
  description?: string;
  duration?: number;
}

export interface AdVariation {
  id: string;
  original_ad_id: string;
  variation_type: 'HOOK' | 'CREATIVE' | 'COPY' | 'CTA' | 'VIDEO_BLOCKS' | 'SCRIPT' | 'VISUALS' | 'INSTRUCTIONS';
  version_number: number;
  title: string;
  description: string;
  optimization_focus: string;
  generated_content: Record<string, unknown>;
  created_at: string;
  hook_variations?: HookVariationDetail[];
  video_blocks?: VideoBlockDetail[];
  predicted_performance?: PredictedPerformance;
}

// New types for the webhook response structure
export interface AIVariationsResponse {
  v1?: HookVariation[];
  v2?: VideoSceneVariation[];
  v3?: VideoSceneVariation[];
  v4?: VideoSceneVariation[];
  v5?: VideoSceneVariation[];
  v6?: InstructionVariation[];
  v7?: InstructionVariation[];
  [key: string]: HookVariation[] | VideoSceneVariation[] | InstructionVariation[] | undefined;
}

// Wrapper type for the new webhook format
export interface AIVariationsWebhookResponse {
  variations: AIVariationsResponse[];
}

export interface HookVariation {
  id: number;
  adit_ad_id: number;
  hook_num: number;
  script: string;
  visual: string;
  text_overlay: string;
  replace_scenes: string;
  created_at: string;
}

export interface VideoSceneVariation {
  id: number;
  audit_ad_id: number;
  scene: number;
  timestamp: string;
  script: string;
  visual: string;
  text_overlay: string;
  shot_type: string;
  value_block_type?: string | null;
  created_at: string;
}

export interface InstructionVariation {
  instruction: string;
}

export interface HookVariationDetail {
  text: string;
  style: string;
  rationale: string;
}

export interface VideoBlockDetail {
  sequence: number;
  content: string;
  duration: number;
  visual_style: string;
}

export interface PredictedPerformance {
  ctr_improvement?: number;
  engagement_improvement?: number;
  retention_improvement?: number;
  confidence_score?: number;
}

export interface HookVariationOld {
  id: string;
  hook_no: number;
  script: string;
  visual: string;
  text_overlay: string;
  replace_scenes: string;
}

export interface VideoBlock {
  scene: number;
  time_stamp: string;
  script: string;
  visual: string;
  text_overlay: string;
  shot_type: string;
}

// Image-specific types
export interface ImageBlock {
  id: number | string;
  element: string;
  position: string;
  content_type: string;
  text: string;
  design_notes: string;
  order?: number;
}

export interface ImageVariation {
  id: number;
  element: string;
  position: string;
  content_type: string;
  text: string;
  visual_desc: string;
  design_notes: string;
}

export interface ImageBlocksResponse {
  data: ImageBlock[];
}

export interface ImageVariationsResponse {
  data: ImageVariation[];
}

// Authentication Types
export type UserRole = 'Admin' | 'Strategist' | 'Client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedAccounts?: string[]; // For Strategists - array of ad account IDs they can access
  createdAt: string;
  createdBy?: string; // ID of admin who created this user
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  users: User[]; // All users (Admin only)
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<{ success: boolean; password?: string; error?: string }>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<boolean>;
  deleteUser: (userId: string) => void;
  hasPermission: (permission: Permission) => boolean;
}

export type Permission = 
  | 'view_all_accounts'
  | 'manage_users'
  | 'manage_ad_accounts'
  | 'view_assigned_accounts_only'
  | 'access_workflow_only';

export interface ClientAccess {
  workflowId: string;
  password: string;
  expiresAt?: string;
}

export interface Brief {
  id: number;
  account_id: string;
  name: string;
  market_awareness: string;
  angle: string;
  format: string;
  theme: string;
  status: 'In Editing' | 'Briefed' | 'Ready to Launch' | 'Launched' | 'Iterating';
  assigned_to: string;
  created_at: string;
  avatar: string;
}
