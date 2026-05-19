'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCreateReminder } from '@/hooks/use-lead-reminders';
import { REMINDER_ACTIONS } from '@/lib/constants';
import { Bell, Calendar } from 'lucide-react';

interface ReminderPickerProps {
  leadId: string;
}

export function ReminderPicker({ leadId }: ReminderPickerProps) {
  const createReminder = useCreateReminder();
  const [action, setAction] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    if (!action || !date || !time) return;
    const remindAt = new Date(`${date}T${time}`).toISOString();
    await createReminder.mutateAsync({ leadId, action, remindAt });
    setAction('');
    setDate('');
    setTime('');
    setOpen(false);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Bell className="h-4 w-4 mr-1" />
          Set Reminder
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Set Reminder
          </h4>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Action</label>
            <Select value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="">Select action...</option>
              {REMINDER_ACTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
              <Input
                type="date"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Time</label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleSave}
              disabled={!action || !date || !time || createReminder.isPending}
            >
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
