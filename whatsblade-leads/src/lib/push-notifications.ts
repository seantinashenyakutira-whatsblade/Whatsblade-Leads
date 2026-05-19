import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

if (env.VAPID_SUBJECT && env.VAPID_PRIVATE_KEY && env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  tag?: string;
  link?: string;
  icon?: string;
  actions?: { action: string; title: string }[];
  requireInteraction?: boolean;
}

export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number }> {
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId);

  if (error || !subscriptions?.length) {
    return { success: 0, failed: 0 };
  }

  let success = 0;
  let failed = 0;

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    tag: payload.tag || 'default',
    data: { link: payload.link || '/dashboard' },
    icon: payload.icon || '/icons/icon-192.png',
    actions: payload.actions || [],
    requireInteraction: payload.requireInteraction || false,
  });

  for (const sub of subscriptions) {
    try {
      const pushSubscription: webpush.PushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.keys.auth,
          p256dh: sub.keys.p256dh,
        },
      };

      await webpush.sendNotification(pushSubscription, notificationPayload);
      success++;
    } catch (error: unknown) {
      failed++;

      const pushError = error as { statusCode?: number };
      if (pushError.statusCode === 410 || pushError.statusCode === 404) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint);
      }
    }
  }

  return { success, failed };
}

export async function sendLeadReplyNotification(
  userId: string,
  leadName: string,
  replyPreview: string
) {
  return sendPushNotification(userId, {
    title: 'Lead Reply',
    body: `${leadName}: ${replyPreview.substring(0, 100)}...`,
    tag: 'lead-reply',
    link: '/dashboard/messages',
    actions: [{ action: 'view', title: 'View Message' }],
  });
}

export async function sendMeetingReminderNotification(
  userId: string,
  leadName: string,
  meetingTime: string
) {
  return sendPushNotification(userId, {
    title: 'Meeting Reminder',
    body: `Meeting with ${leadName} at ${meetingTime}`,
    tag: 'meeting-reminder',
    link: '/dashboard/pipeline',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
}

export async function sendDailySummaryNotification(
  userId: string,
  summary: string
) {
  return sendPushNotification(userId, {
    title: 'Daily Summary',
    body: summary,
    tag: 'daily-summary',
    link: '/dashboard',
  });
}
