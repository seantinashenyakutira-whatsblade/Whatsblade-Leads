'use client';

import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { KanbanColumn } from '@/components/pipeline/kanban-column';
import { usePipeline, useUpdateLeadStatus } from '@/hooks/use-pipeline';
import { PIPELINE_COLUMNS } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import type { LeadStatus } from '@/types';

export default function PipelinePage() {
  const { grouped, isLoading, refetch } = usePipeline();
  const updateStatus = useUpdateLeadStatus();

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;

    await updateStatus.mutateAsync({ id: leadId, status: newStatus });
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="min-w-[280px] w-[280px]">
              <Skeleton className="h-14 w-full rounded-t-lg" />
              <div className="space-y-2 p-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-24 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <p className="text-muted-foreground">Drag and drop leads between stages</p>
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PIPELINE_COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              status={col.id as LeadStatus}
              label={col.label}
              color={col.color}
              leads={grouped[col.id as LeadStatus] || []}
              agentNames={{}}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
