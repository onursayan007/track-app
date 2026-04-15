import { ViolationService } from '../services/violation.service';

let intervalId: ReturnType<typeof setInterval> | null = null;
const FIVE_MINUTES = 5 * 60 * 1000;

async function checkOfflineViolations() {
  try {
    await ViolationService.checkOfflineVehicles();
  } catch (err) {
    console.error('[ViolationCron] Offline kontrol hatası:', (err as Error).message);
  }
}

export function startViolationCron() {
  if (intervalId) return;

  setTimeout(() => {
    checkOfflineViolations();
  }, 15_000);

  intervalId = setInterval(checkOfflineViolations, FIVE_MINUTES);
  console.log('[ViolationCron] Started (every 5 minutes)');
}

export function stopViolationCron() {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
  console.log('[ViolationCron] Stopped');
}
