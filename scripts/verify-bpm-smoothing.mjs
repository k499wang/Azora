/**
 * Verification script for IBI-domain EMA smoothing + outlier rejection.
 * Simulates realistic camera PPG noise and compares old vs new behavior.
 */

// --- Reproduce the relevant HeartRateManager logic ---

const IBI_HISTORY_SIZE = 8;
const MIN_LIVE_BPM_IBIS = 4;
const IBI_EMA_ALPHA = 0.25;

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function medianOfRecent(values, window) {
  const slice = values.slice(-window);
  return median(slice);
}

// OLD behavior: raw median → BPM
function getCurrentBpmOld(ibiHistory) {
  if (ibiHistory.length < MIN_LIVE_BPM_IBIS) return null;
  const med = median(ibiHistory);
  if (med <= 0) return null;
  return Math.round(60000 / med);
}

// NEW behavior: EMA updated at beat cadence, read at frame cadence
function getCurrentBpmNew(ibiEma) {
  if (ibiEma == null || ibiEma <= 0) return null;
  return Math.round(60000 / ibiEma);
}

function updateIbiEma(ibiHistory, ibiEma) {
  if (ibiHistory.length < MIN_LIVE_BPM_IBIS) return ibiEma;
  const med = median(ibiHistory);
  if (med <= 0) return ibiEma;
  if (ibiEma == null) return med;
  return ibiEma * (1 - IBI_EMA_ALPHA) + med * IBI_EMA_ALPHA;
}

function pushAcceptedIbi(ibiHistory, ibi) {
  ibiHistory.push(ibi);
  if (ibiHistory.length > IBI_HISTORY_SIZE) ibiHistory.shift();
}

// --- Simulation with 1-second polling (like the real app) ---

const TRUE_IBI_MS = 800; // 75 BPM baseline
const SESSION_SECONDS = 35;
const BPM_UPDATE_INTERVAL_MS = 1000;

function generateSession() {
  // Generate realistic beat-to-beat IBIs for the full session
  const beatIbms = [];
  let elapsedMs = 0;
  let currentBaseIbi = TRUE_IBI_MS;

  while (elapsedMs < SESSION_SECONDS * 1000) {
    // Normal respiratory noise: ±30ms
    let ibi = currentBaseIbi + (Math.random() - 0.5) * 60;

    // Gradual real trend: HR slows 75 → 65 (IBI 800 → 923)
    const trendFactor = elapsedMs / (SESSION_SECONDS * 1000);
    currentBaseIbi = TRUE_IBI_MS + trendFactor * 123;
    ibi = currentBaseIbi + (Math.random() - 0.5) * 60;

    // Persistent cluster noise (finger shifts slightly for 2-3 beats)
    if (elapsedMs > 8000 && elapsedMs < 11000) ibi += 70;
    if (elapsedMs > 18000 && elapsedMs < 21000) ibi -= 80;

    // Severe outliers
    if (elapsedMs > 14000 && elapsedMs < 15000) ibi = 1280; // missed beat
    if (elapsedMs > 24000 && elapsedMs < 25000) ibi = 410;  // double beat
    if (elapsedMs > 30000 && elapsedMs < 31000) ibi = 1200; // motion

    ibi = Math.max(300, Math.round(ibi));
    beatIbms.push({ ibi, elapsedMs });
    elapsedMs += ibi;
  }

  return beatIbms;
}

function runSimulation() {
  const beatData = generateSession();
  const oldHistory = [];
  const newHistory = [];
  let newEma = null;
  let nextPollAt = 4000; // first poll at 4s (after warmup)
  let beatIndex = 0;

  const results = [];

  for (const beat of beatData) {
    const ibi = beat.ibi;

    // OLD path: accepts ALL ibis
    pushAcceptedIbi(oldHistory, ibi);

    // NEW path: IBI EMA smooths
    pushAcceptedIbi(newHistory, ibi);

    const oldBpm = getCurrentBpmOld(oldHistory);
    newEma = updateIbiEma(newHistory, newEma);
    const newBpm = getCurrentBpmNew(newEma);

    // Poll BPM every 1 second (like the real app)
    if (beat.elapsedMs >= nextPollAt) {
      results.push({
        second: Math.round(beat.elapsedMs / 1000),
        ibi,
        oldBpm,
        newBpm,
      });
      nextPollAt += BPM_UPDATE_INTERVAL_MS;
    }
  }

  return results;
}

function stats(values) {
  const valid = values.filter((v) => v != null);
  const mean = valid.reduce((s, v) => s + v, 0) / valid.length;
  const variance = valid.reduce((s, v) => s + (v - mean) ** 2, 0) / valid.length;
  return { mean: Math.round(mean), stdDev: Math.round(Math.sqrt(variance)) };
}

// --- Run and display ---

const data = runSimulation();

console.log("\n=== BPM Smoothing Verification ===\n");
console.log("Simulated: 35s session, HR slowing 75 → 65 BPM");
console.log("Polling BPM every 1s (like real app). Outliers injected.\n");
console.log("Sec | Last IBI | Acc | Raw BPM | Smoothed BPM");
console.log("----|----------|-----|---------|-------------");

for (const row of data) {
  console.log(
    `${String(row.second).padStart(3)} | ${String(row.ibi).padStart(4)}     | ${row.oldBpm ? String(row.oldBpm).padStart(3) : "  -"}   | ${row.newBpm ? String(row.newBpm).padStart(3) : "  -"}`
  );
}

const oldBpms = data.map((d) => d.oldBpm);
const newBpms = data.map((d) => d.newBpm);

console.log("\n=== Statistics (after warmup) ===");
console.log(`Raw median BPM:     mean=${stats(oldBpms).mean}, stdDev=${stats(oldBpms).stdDev}`);
console.log(`IBI-EMA smoothed:   mean=${stats(newBpms).mean}, stdDev=${stats(newBpms).stdDev}`);

const oldJumps = oldBpms
  .filter((v) => v != null)
  .map((v, i, arr) => (i > 0 ? Math.abs(v - arr[i - 1]) : 0))
  .filter((v) => v > 0);
const newJumps = newBpms
  .filter((v) => v != null)
  .map((v, i, arr) => (i > 0 ? Math.abs(v - arr[i - 1]) : 0))
  .filter((v) => v > 0);

const oldMaxJump = Math.max(...oldJumps);
const newMaxJump = Math.max(...newJumps);
const oldAvgJump = oldJumps.reduce((s, v) => s + v, 0) / oldJumps.length;
const newAvgJump = newJumps.reduce((s, v) => s + v, 0) / newJumps.length;

console.log(`\nMax BPM jump:       raw=${oldMaxJump}, smoothed=${newMaxJump}`);
console.log(`Avg BPM jump:       raw=${oldAvgJump.toFixed(1)}, smoothed=${newAvgJump.toFixed(1)}`);

if (newMaxJump < oldMaxJump && newAvgJump < oldAvgJump) {
  console.log("\n✅ PASS: Smoothed BPM is more stable than raw median");
} else {
  console.log("\n❌ FAIL: Smoothed BPM is not more stable");
}
