import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = "mailto:adrianna@focus-app.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

/**
 * POST /api/push/notify
 * Send a push notification to all subscribers.
 * Body: { title, body, url? }
 *
 * Called by the inbox/meetings endpoints when new items arrive,
 * or by a scheduled workflow for meeting reminders.
 */
export async function POST(request: NextRequest) {
  try {
    const { title, body: notifBody, url } = await request.json();

    if (!title || !notifBody) {
      return NextResponse.json({ error: "title and body required" }, { status: 400 });
    }

    const sql = getDb();
    const subs = await sql`SELECT endpoint, keys_p256dh, keys_auth FROM push_subscriptions`;

    const payload = JSON.stringify({
      title,
      body: notifBody,
      url: url || "/",
      icon: "/icon-192.png",
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subs) {
      const subscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
      };

      try {
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription expired, remove it
          await sql`DELETE FROM push_subscriptions WHERE endpoint = ${sub.endpoint}`;
        }
        failed++;
      }
    }

    return NextResponse.json({ success: true, sent, failed });
  } catch (error) {
    console.error("Push notify error:", error);
    return NextResponse.json({ error: "Failed to send notifications" }, { status: 500 });
  }
}
