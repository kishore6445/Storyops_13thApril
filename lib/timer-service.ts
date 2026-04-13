// Timer session interface
export interface TimerSession {
  id: string
  taskId: string
  taskTitle: string
  clientName: string
  sprintName: string
  startTime: number // timestamp in ms
  endTime?: number // timestamp in ms
  isActive: boolean
  duration: number // in seconds
}

const ACTIVE_SESSIONS_KEY = 'timerSessions'
const COMPLETED_SESSIONS_KEY = 'completedTimerSessions'

// Format seconds to HH:MM:SS
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Format seconds to hours as decimal
export function secondsToHours(seconds: number): number {
  return Math.round((seconds / 3600) * 100) / 100
}

// Get all active timer sessions from localStorage
export function getActiveTimerSessions(): TimerSession[] {
  if (typeof window === 'undefined') return []
  try {
    const sessions = localStorage.getItem(ACTIVE_SESSIONS_KEY)
    return sessions ? JSON.parse(sessions) : []
  } catch (error) {
    console.error('[v0] Error retrieving timer sessions:', error)
    return []
  }
}

// Get completed timer sessions from localStorage
export function getCompletedTimerSessions(): TimerSession[] {
  if (typeof window === 'undefined') return []
  try {
    const sessions = localStorage.getItem(COMPLETED_SESSIONS_KEY)
    return sessions ? JSON.parse(sessions) : []
  } catch (error) {
    console.error('[v0] Error retrieving completed timer sessions:', error)
    return []
  }
}

function setActiveTimerSessions(sessions: TimerSession[]): void {
  localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(sessions))
}

function setCompletedTimerSessions(sessions: TimerSession[]): void {
  localStorage.setItem(COMPLETED_SESSIONS_KEY, JSON.stringify(sessions))
}

// Get a specific timer session
export function getTimerSession(taskId: string): TimerSession | null {
  const sessions = getActiveTimerSessions()
  return sessions.find(s => s.taskId === taskId) || null
}

// Start a new timer session
export function startTimerSession(
  taskId: string,
  taskTitle: string,
  clientName: string,
  sprintName: string
): TimerSession {
  const session: TimerSession = {
    id: `${taskId}-${Date.now()}`,
    taskId,
    taskTitle,
    clientName,
    sprintName,
    startTime: Date.now(),
    isActive: true,
    duration: 0,
  }

  const sessions = getActiveTimerSessions()
  // Stop any existing timer for this task
  const filtered = sessions.filter(s => s.taskId !== taskId)
  filtered.push(session)

  setActiveTimerSessions(filtered)
  return session
}

// Stop a timer session
export function stopTimerSession(taskId: string): TimerSession | null {
  const sessions = getActiveTimerSessions()
  const session = sessions.find(s => s.taskId === taskId)

  if (session) {
    session.isActive = false
    session.endTime = Date.now()
    session.duration = Math.floor((session.endTime - session.startTime) / 1000)
    setActiveTimerSessions(sessions)
    return session
  }

  return null
}

// Pause a timer session (keep it for resume)
export function pauseTimerSession(taskId: string): TimerSession | null {
  const sessions = getActiveTimerSessions()
  const session = sessions.find(s => s.taskId === taskId)

  if (session) {
    session.isActive = false
    setActiveTimerSessions(sessions)
    return session
  }

  return null
}

// Resume a paused timer session
export function resumeTimerSession(taskId: string): TimerSession | null {
  const sessions = getActiveTimerSessions()
  const session = sessions.find(s => s.taskId === taskId)

  if (session && !session.isActive) {
    session.isActive = true
    session.startTime = Date.now() - session.duration * 1000
    setActiveTimerSessions(sessions)
    return session
  }

  return null
}

// Reset a timer session
export function resetTimerSession(taskId: string): void {
  const sessions = getActiveTimerSessions().filter(s => s.taskId !== taskId)
  setActiveTimerSessions(sessions)
}

// Finalize a stopped session: keep it in history, remove it from active list.
export function finalizeTimerSession(taskId: string): TimerSession | null {
  const sessions = getActiveTimerSessions()
  const session = sessions.find(s => s.taskId === taskId)

  if (!session) return null

  const remaining = sessions.filter(s => s.taskId !== taskId)
  setActiveTimerSessions(remaining)

  if (session.duration > 0) {
    const completed = getCompletedTimerSessions().filter(s => s.id !== session.id)
    completed.push(session)
    setCompletedTimerSessions(completed)
  }

  return session
}

// Get today's sessions for a specific task
export function getTodaysSessionsForTask(taskId: string): TimerSession[] {
  const sessions = [...getCompletedTimerSessions(), ...getActiveTimerSessions()]
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return sessions.filter(s => {
    if (s.duration <= 0) return false
    const sessionDate = new Date(s.startTime)
    sessionDate.setHours(0, 0, 0, 0)
    return s.taskId === taskId && sessionDate.getTime() === today.getTime()
  })
}

// Get all today's sessions across all tasks
export function getTodaysSessions(): TimerSession[] {
  const sessions = [...getCompletedTimerSessions(), ...getActiveTimerSessions()]
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return sessions.filter(s => {
    if (s.duration <= 0) return false
    const sessionDate = new Date(s.startTime)
    sessionDate.setHours(0, 0, 0, 0)
    return sessionDate.getTime() === today.getTime()
  })
}

// Calculate total hours for today
export function getTodaysTotalHours(): number {
  const sessions = getTodaysSessions()
  const totalSeconds = sessions.reduce((sum, s) => sum + s.duration, 0)
  return secondsToHours(totalSeconds)
}

// Calculate total hours for a specific task today
export function getTaskTodayHours(taskId: string): number {
  const sessions = getTodaysSessionsForTask(taskId)
  const totalSeconds = sessions.reduce((sum, s) => sum + s.duration, 0)
  return secondsToHours(totalSeconds)
}

// Get current elapsed time for an active session
export function getElapsedTime(taskId: string): number {
  const session = getTimerSession(taskId)
  if (!session) return 0

  if (session.isActive) {
    return Math.floor((Date.now() - session.startTime) / 1000)
  }

  return session.duration
}
