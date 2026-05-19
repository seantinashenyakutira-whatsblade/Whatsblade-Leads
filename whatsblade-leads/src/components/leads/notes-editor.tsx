'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLeadNotes, useCreateNote, useDeleteNote } from '@/hooks/use-lead-notes';
import { useUser } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, formatDate } from '@/lib/utils';
import { Send, Trash2, Paperclip } from 'lucide-react';

interface NotesEditorProps {
  leadId: string;
}

export function NotesEditor({ leadId }: NotesEditorProps) {
  const { data: notes, isLoading } = useLeadNotes(leadId);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const user = useUser();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    await createNote.mutateAsync({ leadId, content: content.trim() });
    setContent('');
    setSubmitting(false);
  };

  const handleDelete = async (noteId: string) => {
    await deleteNote.mutateAsync({ id: noteId });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          className="self-end"
          size="sm"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading notes...</p>
      ) : !notes?.length ? (
        <p className="text-sm text-muted-foreground">No notes yet. Add one above.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const noteUser = note.user_id === user?.id ? user : null;
            return (
              <div key={note.id} className="rounded-lg border p-3 group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">
                        {getInitials(noteUser?.full_name || noteUser?.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">
                      {noteUser?.full_name || noteUser?.email || 'Unknown'}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(note.created_at)}</span>
                  </div>
                  {note.user_id === user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    {note.attachments && note.attachments.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                    {(note.attachments as Array<{ name: string; url: string }>).map((att: { name: string; url: string }) => (
                      <a
                        key={att.url}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        {att.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
