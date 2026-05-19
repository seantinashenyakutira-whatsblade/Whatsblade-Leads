'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/trpc-provider';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';

export default function MessagesPage() {
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.messages.list.useQuery({
    channel: (channel || undefined) as 'email' | 'sms' | 'whatsapp' | 'linkedin' | undefined,
    status: (status || undefined) as 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | undefined,
    page,
    pageSize: 20,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Outreach message history</p>
      </div>

      <div className="flex items-center gap-4">
        <Select value={channel} onChange={(e) => { setChannel(e.target.value); setPage(1); }}>
          <option value="">All channels</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="linkedin">LinkedIn</option>
        </Select>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="bounced">Bounced</option>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Channel</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Delivered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !data?.items.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No messages found
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="capitalize">{msg.channel}</TableCell>
                  <TableCell className="font-medium">{msg.subject || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{msg.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {msg.sent_at ? formatDate(msg.sent_at) : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {msg.delivered_at ? formatDate(msg.delivered_at) : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
