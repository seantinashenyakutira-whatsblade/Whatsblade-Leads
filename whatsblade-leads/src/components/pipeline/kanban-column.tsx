'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './kanban-card';
import { cn } from '@/lib/utils';
import type { Lead, LeadStatus } from '@/types';

interface KanbanColumnProps {
  status: LeadStatus;
  label: string;
  color: string;
  leads: Lead[];
  agentNames: Record<string, string>;
}

export function KanbanColumn({ status, label, color, leads, agentNames }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const totalValue = leads.reduce((sum, l) => sum + (Number(l.deal_value) || 0), 0);

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] bg-muted/30 rounded-lg">
      <div className={cn('p-3 border-b-2 rounded-t-lg', color)}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{label}</h3>
          <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">{leads.length}</span>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            ${totalValue.toLocaleString()}
          </p>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)] min-h-[200px] transition-colors',
          isOver && 'bg-primary/5'
        )}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              agentName={lead.assigned_to ? agentNames[lead.assigned_to] : undefined}
            />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
            Drop leads here
          </div>
        )}
      </div>
    </div>
  );
}
