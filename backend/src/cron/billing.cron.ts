// ════════════════════════════════════════════════════════════════════
// Billing Cron — Daily scheduled tasks for auto-suspension
// Uses a simple setInterval approach (no external cron dependency).
// Runs every 24 hours. Also exports a manual trigger for testing.
// ════════════════════════════════════════════════════════════════════

import { BillingService } from '../services/billing.service';

let intervalId: ReturnType<typeof setInterval> | null = null;

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

/**
 * Run the daily billing check:
 * 1. On the 1st of each month, generate RECURRING invoices for all active tenants
 * 2. Find PENDING invoices past 15-day grace period
 * 3. Mark them OVERDUE
 * 4. Suspend the associated tenants
 */
async function dailyBillingCheck(): Promise<void> {
  console.log(`[BillingCron] Running daily billing check at ${new Date().toISOString()}`);
  try {
    // On the 1st of the month, generate recurring invoices
    const today = new Date();
    if (today.getDate() === 1) {
      console.log('[BillingCron] 1st of month — generating recurring invoices...');
      const invoiceResult = await BillingService.generateMonthlyInvoices();
      console.log(`[BillingCron] Generated ${invoiceResult.generatedCount} invoice(s), skipped ${invoiceResult.skippedCount}`);
    }

    // Grace period check (runs every day)
    const result = await BillingService.runGracePeriodCheck();
    if (result.suspendedCount > 0) {
      console.log(`[BillingCron] Suspended ${result.suspendedCount} tenant(s)`);
    } else {
      console.log('[BillingCron] No tenants to suspend');
    }
  } catch (err) {
    console.error('[BillingCron] Error during daily check:', (err as Error).message);
  }
}

/**
 * Start the daily billing cron.
 * Runs immediately on startup then every 24 hours.
 */
export function startBillingCron(): void {
  if (intervalId) return; // Already running

  console.log('[BillingCron] Starting daily billing scheduler');

  // Run once on boot (delayed 10s to let DB connections settle)
  setTimeout(() => {
    dailyBillingCheck();
  }, 10_000);

  // Then every 24 hours
  intervalId = setInterval(dailyBillingCheck, TWENTY_FOUR_HOURS);
}

/**
 * Stop the cron (for graceful shutdown).
 */
export function stopBillingCron(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[BillingCron] Stopped');
  }
}

/**
 * Manual trigger (exposed via API for SuperAdmin testing).
 */
export { dailyBillingCheck };
