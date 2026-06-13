/**
 * Sanity check for the proportional phase model.
 * Run:  npx tsx packages/phase-data/scripts/verify-tiling.ts
 *
 * Proves the four phase windows TILE the whole cycle (no gaps, no overlaps)
 * for 21 / 28 / 35-day cycles, and that getCyclePrediction stays consistent.
 */
import { getPhaseRanges, getCyclePrediction } from '../src/index'

let failures = 0
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failures++
    console.error('  ✗ FAIL:', msg)
  }
}

function checkTiling(cycleLength: number, periodLength: number) {
  const ranges = getPhaseRanges(cycleLength, periodLength)
  console.log(`\nCycle ${cycleLength}d · period ${periodLength}d`)
  for (const r of ranges) {
    console.log(`  ${r.phase.padEnd(11)} days ${r.startDay}–${r.endDay} (${r.endDay - r.startDay + 1}d)`)
  }

  // 1) starts at day 1, ends at cycleLength
  assert(ranges[0].startDay === 1, 'first range must start on day 1')
  assert(ranges[ranges.length - 1].endDay === cycleLength, `last range must end on day ${cycleLength}`)

  // 2) contiguous (no gaps, no overlaps) + each window non-empty
  for (let i = 0; i < ranges.length; i++) {
    assert(ranges[i].endDay >= ranges[i].startDay, `${ranges[i].phase} window must be non-empty`)
    if (i > 0) {
      assert(
        ranges[i].startDay === ranges[i - 1].endDay + 1,
        `gap/overlap between ${ranges[i - 1].phase} and ${ranges[i].phase}`
      )
    }
  }

  // 3) every day 1..cycleLength belongs to exactly one range
  for (let d = 1; d <= cycleLength; d++) {
    const hits = ranges.filter((r) => d >= r.startDay && d <= r.endDay).length
    assert(hits === 1, `day ${d} belongs to ${hits} phases (expected 1)`)
  }
}

;[
  [21, 5],
  [28, 5],
  [35, 5],
  [28, 3],
  [35, 7],
].forEach(([c, p]) => checkTiling(c, p))

// Prediction consistency: from the start date, currentDay === 1 and currentPhase === menstrual;
// nextPeriodStart is exactly cycleLength days after the start.
const pred = getCyclePrediction({ startDate: '2026-01-01', cycleLength: 30, periodLength: 5 }, '2026-01-01')
assert(pred.currentDay === 1, 'currentDay on start date should be 1')
assert(pred.currentPhase === 'menstrual', 'currentPhase on day 1 should be menstrual')
assert(pred.nextPeriodStart === '2026-01-31', `nextPeriodStart should be 2026-01-31, got ${pred.nextPeriodStart}`)
assert(pred.phaseRanges[0].startDate === '2026-01-01', 'first phase startDate should equal cycle start')

console.log(failures === 0 ? '\n✓ ALL TILING + PREDICTION CHECKS PASSED' : `\n✗ ${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
