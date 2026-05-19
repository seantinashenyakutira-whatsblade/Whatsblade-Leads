import { stringify } from 'csv-stringify/sync';
import * as XLSX from 'xlsx';
import type { Lead } from '@/types';

type ExportableLead = Pick<
  Lead,
  'first_name' | 'last_name' | 'email' | 'phone' | 'company' | 'position' | 'website' | 'status' | 'source' | 'notes' | 'created_at' | 'industry' | 'city' | 'country' | 'lead_score' | 'deal_value' | 'expected_close_date' | 'last_contacted_at'
>;

function flattenLeads(leads: ExportableLead[]): Record<string, unknown>[] {
  return leads.map((l) => ({
    'First Name': l.first_name ?? '',
    'Last Name': l.last_name ?? '',
    Email: l.email ?? '',
    Phone: l.phone ?? '',
    Company: l.company ?? '',
    Position: l.position ?? '',
    Website: l.website ?? '',
    Status: l.status,
    Industry: l.industry ?? '',
    City: l.city ?? '',
    Country: l.country ?? '',
    'Lead Score': String(l.lead_score ?? 0),
    'Deal Value': String(l.deal_value ?? 0),
    'Expected Close': l.expected_close_date ?? '',
    'Last Contacted': l.last_contacted_at ?? '',
    Source: l.source ?? '',
    Notes: l.notes ?? '',
    Created: l.created_at,
  }));
}

export function exportToCSV(leads: ExportableLead[]): string {
  const data = flattenLeads(leads);
  return stringify(data, { header: true });
}

export function exportToExcel(leads: ExportableLead[]): Buffer {
  const data = flattenLeads(leads);
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(buffer);
}
