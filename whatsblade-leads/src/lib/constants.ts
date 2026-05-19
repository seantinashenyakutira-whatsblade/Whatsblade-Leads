export const ROLES = {
  ADMIN: 'admin' as const,
  AGENT: 'agent' as const,
} as const;

export const LEAD_STATUS = {
  NEW: 'new' as const,
  CONTACTED: 'contacted' as const,
  REPLIED: 'replied' as const,
  MEETING_BOOKED: 'meeting_booked' as const,
  PROPOSAL_SENT: 'proposal_sent' as const,
  CONVERTED: 'converted' as const,
  LOST: 'lost' as const,
} as const;

export const PIPELINE_COLUMNS = [
  { id: 'new', label: 'New Lead', color: 'border-blue-500' },
  { id: 'contacted', label: 'Contacted', color: 'border-yellow-500' },
  { id: 'replied', label: 'Replied', color: 'border-green-500' },
  { id: 'meeting_booked', label: 'Meeting Booked', color: 'border-purple-500' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: 'border-orange-500' },
  { id: 'converted', label: 'Closed Won', color: 'border-emerald-500' },
  { id: 'lost', label: 'Closed Lost', color: 'border-red-500' },
] as const;

export const REMINDER_ACTIONS = [
  'Call',
  'Email',
  'Follow up',
  'Send proposal',
  'Schedule meeting',
  'Send contract',
  'Check in',
  'Other',
] as const;

export const CAMPAIGN_STATUS = {
  DRAFT: 'draft' as const,
  ACTIVE: 'active' as const,
  PAUSED: 'paused' as const,
  COMPLETED: 'completed' as const,
} as const;

export const MESSAGE_CHANNELS = ['email', 'sms', 'whatsapp', 'linkedin'] as const;
export const MESSAGE_STATUSES = ['pending', 'sent', 'delivered', 'failed', 'bounced'] as const;

export const EVENT_TYPES = [
  'lead.created',
  'lead.updated',
  'lead.deleted',
  'lead.assigned',
  'lead.converted',
  'campaign.created',
  'campaign.started',
  'campaign.paused',
  'campaign.completed',
  'message.sent',
  'message.delivered',
  'message.failed',
  'message.opened',
  'message.replied',
  'user.invited',
  'user.role_changed',
  'api_key.created',
  'api_key.deleted',
  'webhook.triggered',
  'webhook.created',
  'webhook.deleted',
] as const;

export const RATE_LIMIT = {
  WINDOW_MS: 60_000,
  MAX_REQUESTS: 100,
};

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};
