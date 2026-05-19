'use client';

import { Select } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { User } from 'lucide-react';

interface AgentSelectorProps {
  agents: { id: string; full_name: string | null; email: string; role: string }[];
  value: string | null;
  onChange: (userId: string | null) => void;
  isAdmin: boolean;
}

export function AgentSelector({ agents, value, onChange, isAdmin }: AgentSelectorProps) {
  if (!isAdmin) return null;

  return (
    <div className="flex items-center gap-2">
      <User className="h-4 w-4 text-muted-foreground" />
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Unassigned</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.full_name || agent.email} ({agent.role})
          </option>
        ))}
      </Select>
    </div>
  );
}

export function AgentAvatar({ name, className = '' }: { name: string | null; className?: string }) {
  return (
    <Avatar className={`h-6 w-6 ${className}`}>
      <AvatarFallback className="text-[10px]">
        {getInitials(name || 'U')}
      </AvatarFallback>
    </Avatar>
  );
}
