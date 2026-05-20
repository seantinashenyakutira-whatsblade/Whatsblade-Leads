export type UserRole = 'admin' | 'agent';
export type LeadStatus = 'new' | 'contacted' | 'replied' | 'meeting_booked' | 'proposal_sent' | 'converted' | 'lost';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type MessageChannel = 'email' | 'sms' | 'whatsapp' | 'linkedin' | 'instagram' | 'facebook';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
export type LeadSourcePlatform = 'google' | 'facebook' | 'manual';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  assigned_to: string | null;
  created_by: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  website: string | null;
  status: LeadStatus;
  source: string | null;
  notes: string | null;
  attachments: string[];
  custom_fields: Record<string, unknown>;
  google_place_id: string | null;
  facebook_page_id: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  google_rating: number | null;
  google_review_count: number | null;
  social_media: Record<string, string>;
  lead_score: number;
  source_platform: LeadSourcePlatform;
  industry: string | null;
  photos: string[];
  photo_urls: string[];
  opening_hours: Record<string, unknown>;
  opening_hours_formatted: string | null;
  price_level: number | null;
  created_at: string;
  updated_at: string;
  last_contacted_at: string | null;
  deal_value: number | null;
  expected_close_date: string | null;
  next_action: string | null;
  next_action_date: string | null;
  instagram_url: string | null;
  instagram_followers: number | null;
  instagram_verified: boolean;
  facebook_followers: number | null;
  facebook_last_post_date: string | null;
  whatsapp_available: boolean;
  website_status: string | null;
  has_booking_system: boolean;
  is_mobile_responsive: boolean;
  website_quality_score: number | null;
  social_presence_score: number | null;
  ai_summary: string | null;
  opportunity_tags: string[];
  last_enriched_at: string | null;
  enrichment_status: string;
  technographics: Record<string, unknown>;
  email_addresses: string[];
  review_sentiment_score: number | null;
  competitor_analysis: Record<string, unknown>[];
}

export interface LeadNote {
  id: string;
  lead_id: string;
  user_id: string;
  content: string;
  attachments: { name: string; url: string; size: number; type: string }[];
  created_at: string;
  updated_at: string;
}

export interface LeadReminder {
  id: string;
  lead_id: string;
  user_id: string;
  action: string;
  remind_at: string;
  status: 'pending' | 'done' | 'overdue';
  completed_at: string | null;
  created_at: string;
}

export interface SavedFilter {
  id: string;
  user_id: string;
  name: string;
  filter_config: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DiscoveredLead {
  id: string;
  name: string;
  industry: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  emailAddresses: string[];
  website: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  socialMedia: Record<string, string>;
  leadScore: number;
  source: LeadSourcePlatform;
  photos: string[];
  openingHours: Record<string, unknown>;
  openingHoursFormatted: string | null;
  priceLevel: number | null;
  googlePlaceId: string | null;
  facebookPageId: string | null;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  created_by: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignLead {
  id: string;
  campaign_id: string;
  lead_id: string;
  added_at: string;
}

export interface Message {
  id: string;
  lead_id: string;
  campaign_id: string | null;
  sent_by: string;
  channel: MessageChannel;
  subject: string | null;
  body: string;
  status: MessageStatus;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  replied_at: string | null;
  metadata: Record<string, unknown>;
  platform: string | null;
  ai_generated: boolean;
  character_count: number | null;
  template_id: string | null;
  created_at: string;
}

export interface BusinessProfile {
  id: string;
  user_id: string;
  business_name: string;
  services: string[];
  pricing_info: string | null;
  offer_text: string | null;
  location: string | null;
  base_currency: string;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplate {
  id: string;
  user_id: string;
  name: string;
  platform: MessageChannel;
  tone: string;
  language: string;
  body: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

export interface LeadAnalysis {
  id: string;
  lead_id: string;
  summary: string | null;
  opportunity_tags: string[];
  recommended_platform: MessageChannel | null;
  recommended_tone: string | null;
  generated_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  provider: string;
  key_preview: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Webhook {
  id: string;
  user_id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ThemePreference = 'dark' | 'light' | 'system';

export interface UserPreferences {
  id: string;
  user_id: string;
  default_country: string | null;
  default_currency: string;
  favourite_industries: string[];
  notification_email: boolean;
  notification_inapp: boolean;
  notification_slack: boolean;
  notification_webhook: boolean;
  theme: ThemePreference;
  created_at: string;
  updated_at: string;
}

export interface Integration {
  id: string;
  user_id: string;
  type: string;
  name: string;
  config: Record<string, unknown>;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiUsageLog {
  id: string;
  user_id: string | null;
  provider: string;
  endpoint: string | null;
  status_code: number | null;
  response_time_ms: number | null;
  success: boolean;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalLeads: number;
  totalCampaigns: number;
  totalMessages: number;
  totalRevenue: number;
  newUsersThisMonth: number;
  leadsThisWeek: number;
}

export interface AgentPerformance {
  user_id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  leads_added: number;
  messages_sent: number;
  meetings_booked: number;
  deals_closed: number;
  total_revenue: number;
}

export interface ApiUsageStats {
  date: string;
  provider: string;
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  avg_response_time_ms: number;
}

export interface LeadSourceBreakdown {
  source: string;
  count: number;
  percentage: number;
}

export interface SystemHealth {
  database: { status: 'healthy' | 'degraded' | 'down'; latency_ms: number };
  api_keys: { total: number; expiring_soon: number; expired: number };
  webhooks: { total: number; active: number; failing: number };
  queue_depth: number;
  last_backup: string | null;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  query: string;
  industry: string | null;
  country: string | null;
  city: string | null;
  radius: number | null;
  filters: Record<string, unknown>;
  result_count: number;
  created_at: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  industry: string | null;
  country: string | null;
  city: string | null;
  radius: number;
  filters: Record<string, unknown>;
  max_results: number;
  sort_by: string;
  sort_order: 'asc' | 'desc';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnrichmentSchedule {
  id: string;
  user_id: string;
  lead_id: string;
  schedule_type: string;
  scheduled_at: string;
  recurrence: string | null;
  status: string;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
}
