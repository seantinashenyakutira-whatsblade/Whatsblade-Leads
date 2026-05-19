'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Send } from 'lucide-react';
import type { Message } from '@/types';

interface MessageHistoryProps {
  messages: Message[];
  daysSinceLastContact: number | null;
  onUpdateStatus: (messageId: string, status: 'sent' | 'replied' | 'no_response') => Promise<void>;
}

const PLATFORM_ICONS: Record<string, string> = {
  whatsapp: '💬',
  instagram: '📸',
  facebook: '👤',
  email: '📧',
  sms: '',
  linkedin: '💼',
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: 'Pending', icon: <Clock className="h-3 w-3" />, color: 'text-muted-foreground' },
  sent: { label: 'Sent', icon: <Send className="h-3 w-3" />, color: 'text-blue-500' },
  delivered: { label: 'Delivered', icon: <CheckCircle className="h-3 w-3" />, color: 'text-green-500' },
  failed: { label: 'Failed', icon: <XCircle className="h-3 w-3" />, color: 'text-red-500' },
  bounced: { label: 'Bounced', icon: <AlertCircle className="h-3 w-3" />, color: 'text-orange-500' },
};

export function MessageHistory({ messages, daysSinceLastContact, onUpdateStatus }: MessageHistoryProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusUpdate = async (messageId: string, status: 'sent' | 'replied' | 'no_response') => {
    setUpdatingId(messageId);
    try {
      await onUpdateStatus(messageId, status);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {daysSinceLastContact !== null && (
        <div className={`rounded-lg border p-3 ${daysSinceLastContact > 7 ? 'bg-yellow-50 border-yellow-200' : daysSinceLastContact > 3 ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {daysSinceLastContact === 0
                ? 'Contacted today'
                : daysSinceLastContact === 1
                ? 'Last contact: 1 day ago'
                : `Last contact: ${daysSinceLastContact} days ago`}
            </span>
          </div>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No outreach history yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const statusConfig = STATUS_CONFIG[msg.status] || STATUS_CONFIG.pending;
            const platformIcon = PLATFORM_ICONS[msg.platform || msg.channel] || '';

            return (
              <div key={msg.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{platformIcon}</span>
                    <span className="text-sm font-medium capitalize">{msg.platform || msg.channel}</span>
                    {msg.ai_generated && (
                      <Badge variant="secondary" className="text-[10px]">AI Generated</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-xs ${statusConfig.color}`}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(msg.created_at)}</span>
                  </div>
                </div>

                {msg.subject && (
                  <div className="text-sm font-medium">Subject: {msg.subject}</div>
                )}

                <div className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">{msg.body}</div>

                {msg.status === 'pending' || msg.status === 'delivered' ? (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Update status:</span>
                    <Select
                      value=""
                      onChange={(e) => handleStatusUpdate(msg.id, e.target.value as 'sent' | 'replied' | 'no_response')}
                      disabled={updatingId === msg.id}
                    >
                      <option value="">Select...</option>
                      <option value="sent">Sent</option>
                      <option value="replied">Replied</option>
                      <option value="no_response">No Response</option>
                    </Select>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
