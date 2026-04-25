/**
 * Sprint Naming & Auto-Creation Utilities
 * Format: Sprint N_XXX_MonDD-MonDD (e.g., Sprint 1_WAR_Apr27-May3)
 */

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/**
 * Get client code (first 3 letters, uppercase)
 */
export function getClientCode(clientName: string): string {
  return clientName.slice(0, 3).toUpperCase()
}

/**
 * Format date as "MonDD" (e.g., "Apr27")
 */
function formatDateShort(date: Date): string {
  const month = MONTH_ABBR[date.getMonth()]
  const day = date.getDate()
  return `${month}${day}`
}

/**
 * Get the Monday of the current week
 */
export function getCurrentWeekMonday(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(now.setDate(diff))
}

/**
 * Get the Saturday of the current week (5 days after Monday)
 */
export function getCurrentWeekSaturday(): Date {
  const monday = getCurrentWeekMonday()
  const saturday = new Date(monday)
  saturday.setDate(saturday.getDate() + 5)
  return saturday
}

/**
 * Get the Monday of the next week
 */
export function getNextWeekMonday(): Date {
  const currentSaturday = getCurrentWeekSaturday()
  const nextMonday = new Date(currentSaturday)
  nextMonday.setDate(nextMonday.getDate() + 2) // Next Monday after Saturday
  return nextMonday
}

/**
 * Get the Saturday of the next week
 */
export function getNextWeekSaturday(): Date {
  const nextMonday = getNextWeekMonday()
  const nextSaturday = new Date(nextMonday)
  nextSaturday.setDate(nextSaturday.getDate() + 5)
  return nextSaturday
}

/**
 * Generate sprint name with next sequence number
 * Format: Sprint N_XXX_MonDD-MonDD
 * @param clientName - Client name (e.g., "Warrior CEO")
 * @param nextSequenceNumber - Next sprint sequence for this client (e.g., 1, 2, 3)
 * @param startDate - Sprint start date (Monday, optional - uses next Monday if not provided)
 * @param endDate - Sprint end date (Saturday, optional - auto-calculated from startDate)
 */
export function generateSprintName(
  clientName: string,
  nextSequenceNumber: number,
  startDate?: Date,
  endDate?: Date
): string {
  const clientCode = getClientCode(clientName)
  const start = startDate || getNextWeekMonday()
  const end = endDate || (() => {
    const sat = new Date(start)
    sat.setDate(sat.getDate() + 5)
    return sat
  })()

  const dateRange = `${formatDateShort(start)}-${formatDateShort(end)}`
  return `Sprint ${nextSequenceNumber}_${clientCode}_${dateRange}`
}

/**
 * Extract sequence number from sprint name
 * Returns null if name doesn't match the pattern
 */
export function extractSequenceNumber(sprintName: string): number | null {
  const match = sprintName.match(/^Sprint (\d+)_/)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Get the next sequence number for a client based on existing sprints
 * @param sprints - Array of sprint objects with 'name' field
 */
export function getNextSequenceNumber(sprints: Array<{ name: string }>): number {
  if (sprints.length === 0) return 1

  const sequences = sprints
    .map(s => extractSequenceNumber(s.name))
    .filter((n): n is number => n !== null)

  return Math.max(...sequences, 0) + 1
}
