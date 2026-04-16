/**
 * leadQueue.js — Bounded concurrency queue for the Playwright bot.
 *
 * Each headless Chromium instance uses ~150-300MB. On a 512MB Railway dyno we
 * can safely run 1-2 in parallel. p-queue gives us a small async queue with
 * a concurrency cap; jobs run as workers free up. Use ONE shared queue across
 * the whole process so throttling is global, not per-request.
 */

let pQueue;
let queueInstance = null;

const CONCURRENCY = parseInt(process.env.BOT_CONCURRENCY, 10) || 1;

async function getQueue() {
  if (queueInstance) return queueInstance;
  // p-queue v8+ is ESM-only — dynamic import from CJS
  if (!pQueue) {
    const mod = await import('p-queue');
    pQueue = mod.default;
  }
  queueInstance = new pQueue({ concurrency: CONCURRENCY });
  return queueInstance;
}

/**
 * Enqueue a lead-submission job. Returns a Promise that resolves with the
 * job's result. Caller decides whether to await it (sync response) or
 * fire-and-forget (async response to the user).
 */
async function enqueue(jobFn) {
  const q = await getQueue();
  return q.add(jobFn);
}

async function getStats() {
  const q = await getQueue();
  return {
    concurrency: q.concurrency,
    size: q.size,        // queued (not yet running)
    pending: q.pending   // currently running
  };
}

module.exports = { enqueue, getStats };
