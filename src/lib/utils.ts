import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    replied: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    meeting_booked: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    proposal_sent: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    qualified: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    converted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100',
    lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-800';
}
