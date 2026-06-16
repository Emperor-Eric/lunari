/**
 * Deterministic repro for the OPEN-period menstrual bug.
 * Run:  npx tsx packages/phase-data/scripts/verify-open-period.ts
 *
 * Scenario: a 28-day cycle with one ENDED period (~2 days) and one OPEN period
 * started 3 days ago. Today should be MENSTRUAL (the period is still ongoing),
 * not Follicular — even though the learned average (2d) is shorter than 3 days.
 */
import { getEffectiveCycle, getDayInCycle, getPhaseForDay } from '../src/index'

const TODAY = '2026-06-15'
const settings = { startDate: '2026-05-15', cycleLength: 28, periodLength: 5 }
const events = [
  { startDate: '2026-05-15', endDate: '2026-05-16' }, // ended, 2-day period
  { startDate: '2026-06-12', endDate: null }, // OPEN, started 3 days ago
]

const eff = getEffectiveCycle(settings, events, TODAY)
const cycleDay = getDayInCycle(eff.anchorDate, TODAY, eff.cycleLength)
const phase = getPhaseForDay(cycleDay, eff.cycleLength, eff.currentPeriodLength).id

console.log('today                :', TODAY)
console.log('anchorDate           :', eff.anchorDate, '(most recent logged start)')
console.log('cycleLength (learned):', eff.cycleLength)
console.log('periodLength (avg→future):', eff.periodLength)
console.log('currentPeriodLength  :', eff.currentPeriodLength)
console.log('cycleDay (today)     :', cycleDay)
console.log('phase (today)        :', phase)

// Boundary is INCLUSIVE: cycleDay == currentPeriodLength is still Menstrual.
const lastMens = getPhaseForDay(eff.currentPeriodLength, eff.cycleLength, eff.currentPeriodLength).id
const firstAfter = getPhaseForDay(eff.currentPeriodLength + 1, eff.cycleLength, eff.currentPeriodLength).id

let fail = 0
const expect = (cond: boolean, msg: string) => {
  if (!cond) { fail++; console.error('  ✗', msg) }
}
expect(phase === 'menstrual', `today should be menstrual, got ${phase}`)
expect(lastMens === 'menstrual', `cycleDay == currentPeriodLength (${eff.currentPeriodLength}) should be menstrual, got ${lastMens}`)
expect(firstAfter !== 'menstrual', `cycleDay = currentPeriodLength+1 should NOT be menstrual, got ${firstAfter}`)
expect(eff.periodLength === 2, `learned periodLength should stay 2 (for future cycles), got ${eff.periodLength}`)

// Cap: an open period running > 10 days falls back to the projected length.
const stale = getEffectiveCycle(settings, [{ startDate: '2026-06-01', endDate: null }], TODAY)
expect(stale.currentPeriodLength === stale.periodLength, `>10-day open period should fall back to projected, got ${stale.currentPeriodLength}`)

console.log(fail === 0 ? '\n✓ ALL CHECKS PASSED' : `\n✗ ${fail} CHECK(S) FAILED`)
process.exit(fail === 0 ? 0 : 1)
