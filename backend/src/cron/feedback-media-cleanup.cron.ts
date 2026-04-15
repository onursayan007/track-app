import fs from 'fs/promises';
import path from 'path';
import prisma from '../lib/prisma';

let intervalId: ReturnType<typeof setInterval> | null = null;
const SIX_HOURS = 6 * 60 * 60 * 1000;

async function runCleanup() {
  try {
    const now = new Date();
    const expired = await prisma.feedback.findMany({
      where: {
        mediaUrl: { not: null },
        mediaExpiresAt: { lt: now },
      },
      select: { id: true, mediaUrl: true },
    });

    for (const item of expired) {
      if (item.mediaUrl) {
        const basename = path.basename(item.mediaUrl);
        const filePath = path.join(__dirname, '..', '..', 'uploads', basename);
        await fs.unlink(filePath).catch(() => undefined);
      }

      await prisma.feedback.update({
        where: { id: item.id },
        data: {
          mediaUrl: null,
          mediaExpiresAt: null,
        },
      });
    }
  } catch (err) {
    console.error('[FeedbackMediaCleanup] Hata:', (err as Error).message);
  }
}

export function startFeedbackMediaCleanupCron() {
  if (intervalId) return;

  setTimeout(() => {
    runCleanup();
  }, 20_000);

  intervalId = setInterval(runCleanup, SIX_HOURS);
  console.log('[FeedbackMediaCleanup] Started (every 6 hours)');
}

export function stopFeedbackMediaCleanupCron() {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
  console.log('[FeedbackMediaCleanup] Stopped');
}
