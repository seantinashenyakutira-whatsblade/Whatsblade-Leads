import { z } from 'zod';

export const leadSchema = z.object({
  firstName: z.string().max(100).optional().or(z.literal('')),
  lastName: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  company: z.string().max(200).optional().or(z.literal('')),
  position: z.string().max(200).optional().or(z.literal('')),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  status: z.enum(['new', 'contacted', 'replied', 'meeting_booked', 'proposal_sent', 'converted', 'lost']).default('new'),
  source: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(5000).optional().or(z.literal('')),
  assignedTo: z.string().uuid().optional().nullable(),
  customFields: z.record(z.unknown()).optional(),
  dealValue: z.number().min(0).optional().nullable(),
  expectedCloseDate: z.string().date().optional().nullable(),
  nextAction: z.string().max(500).optional().nullable(),
  nextActionDate: z.string().datetime().optional().nullable(),
});

export const leadFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['new', 'contacted', 'replied', 'meeting_booked', 'proposal_sent', 'converted', 'lost']).optional(),
  assignedTo: z.string().uuid().optional(),
  source: z.string().optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  minLeadScore: z.number().int().min(0).max(100).optional(),
  maxLeadScore: z.number().int().min(0).max(100).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  hasPhone: z.boolean().optional(),
  hasEmail: z.boolean().optional(),
  hasSocial: z.boolean().optional(),
  lastContactedFrom: z.string().datetime().optional(),
  lastContactedTo: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['created_at', 'first_name', 'last_name', 'email', 'status', 'updated_at', 'lead_score', 'company', 'last_contacted_at', 'deal_value']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const assignLeadSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1),
  userId: z.string().uuid('Valid user ID is required'),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type LeadFilterInput = z.infer<typeof leadFilterSchema>;
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
