"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Send, Calendar, Clock, CheckCircle2, Copy, Check, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTime } from "@/lib/timer-service"
import { AuthGuard } from "@/components/auth-guard"
import { TopNav } from "@/components/top-nav"
import { Sidebar } from "@/components/sidebar"
import { BreadcrumbTrail } from "@/components/breadcrumb-trail"
import { TeamWorkView } from "@/components/team-work-view"

interface TimeEntry {
  id: string
  client: string
  sprint: string
  task: string
  hours: number
  description: string
}

interface DailyReport {
  date: string
  status: "draft" | "submitted"
  entries: TimeEntry[]
  totalHours: number
}

function mapApiEntry(entry: any): TimeEntry {
  return {
    id: String(entry.id),
    client: entry.clients?.name || entry.client_name || "Unknown Client",
    sprint: entry.sprints?.name || entry.sprint_name || "Unknown Sprint",
    task: entry.tasks?.title || entry.task_title || "Untitled Task",
    hours: Number(entry.hours || 0),
    description: entry.description || entry.work_description || "",
  }
}

function isSameSessionDate(session: any, date: string) {
  return session?.session_date === date
}

function mergeSession(existingSessions: any[], session: any) {
  const remainingSessions = existingSessions.filter((existing) => String(existing.id) !== String(session.id))
  return [session, ...remainingSessions]
}



export default function DailyReportPage() {
  const [currentDate, setCurrentDate] = useState<string>(() => {
    const date = new Date()
    return date.toISOString().split("T")[0]
  })
  const [activeTab, setActiveTab] = useState<"personal" | "team">("personal")

  const [trackedHours, setTrackedHours] = useState(0)
  const [todaySessions, setTodaySessions] = useState<any[]>([])
  const [loadingTodaySessions, setLoadingTodaySessions] = useState(true)
  const [showAllPomodoroSessions, setShowAllPomodoroSessions] = useState(false)

  const loadTodaySessions = useCallback(() => {
    setLoadingTodaySessions(true)
    const token = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
    fetch(`/api/timer-sessions?date=${currentDate}`, { headers })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || "Failed to load timer sessions")
        }
        return data
      })
      .then(data => {
        const sessions = data.sessions || []
        setTodaySessions(sessions)
        const totalSeconds = sessions.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0)
        setTrackedHours(Math.round((totalSeconds / 3600) * 100) / 100)
      })
      .catch((error) => {
        console.error("[v0] Error loading timer sessions:", error)
        setTodaySessions([])
        setTrackedHours(0)
      })
      .finally(() => {
        setLoadingTodaySessions(false)
      })
  }, [currentDate])

  useEffect(() => {
    setTodaySessions([])
    setTrackedHours(0)
    setShowAllPomodoroSessions(false)
  }, [currentDate])

  // Fetch pomodoro sessions from DB for the selected date
  useEffect(() => {
    const handleCaptured = (event: Event) => {
      const customEvent = event as CustomEvent<{ session?: any }>
      const session = customEvent.detail?.session

      if (session && isSameSessionDate(session, currentDate)) {
        setTodaySessions((currentSessions) => {
          const nextSessions = mergeSession(currentSessions, session)
          const totalSeconds = nextSessions.reduce((sum: number, currentSession: any) => sum + (currentSession.duration_seconds || 0), 0)
          setTrackedHours(Math.round((totalSeconds / 3600) * 100) / 100)
          return nextSessions
        })
        return
      }

      loadTodaySessions()
    }

    loadTodaySessions()
    window.addEventListener("timer-session-captured", handleCaptured as EventListener)
    window.addEventListener("focus", handleCaptured)

    return () => {
      window.removeEventListener("timer-session-captured", handleCaptured as EventListener)
      window.removeEventListener("focus", handleCaptured)
    }
  }, [loadTodaySessions])

  const [entries, setEntries] = useState<TimeEntry[]>([])

  const [selectedClientId, setSelectedClientId] = useState("")
  const [selectedSprintId, setSelectedSprintId] = useState("")
  const [selectedTaskId, setSelectedTaskId] = useState("")
  const [hours, setHours] = useState("")
  const [description, setDescription] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pendingEditEntry, setPendingEditEntry] = useState<TimeEntry | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [reportStatus, setReportStatus] = useState<"draft" | "submitted">("draft")
  const [savingEntry, setSavingEntry] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // --- Live data ---
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [sprints, setSprints] = useState<{ id: string; name: string; tasks: { id: string; title: string }[] }[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingSprints, setLoadingSprints] = useState(false)

  useEffect(() => {
    setLoadingClients(true)
    const token = localStorage.getItem("sessionToken")
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
    fetch("/api/clients", { headers })
      .then(r => r.json())
      .then(data => setClients((data.clients || []).map((c: any) => ({ id: String(c.id), name: c.name }))))
      .catch(() => setClients([]))
      .finally(() => setLoadingClients(false))
  }, [])

  useEffect(() => {
    if (!selectedClientId) { setSprints([]); return }
    setLoadingSprints(true)
    const token = localStorage.getItem("sessionToken")
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
    fetch(`/api/sprints?clientId=${selectedClientId}`, { headers })
      .then(r => r.json())
      .then(data =>
        setSprints(
          (data.sprints || []).map((s: any) => ({
            id: String(s.id),
            name: s.name,
            tasks: (s.tasks || []).map((t: any) => ({ id: String(t.id), title: t.title })),
          }))
        )
      )
      .catch(() => setSprints([]))
      .finally(() => setLoadingSprints(false))
  }, [selectedClientId])

  useEffect(() => {
    const token = localStorage.getItem("sessionToken")
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
    let isCancelled = false

    fetch(`/api/daily-reports?date=${currentDate}`, { headers })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.error || "Failed to load daily report")
        }
        return data
      })
      .then((data) => {
        if (isCancelled) return
        setEntries((data.entries || []).map(mapApiEntry))
        setReportStatus(data.report?.status || "draft")
      })
      .catch((error) => {
        if (isCancelled) return
        console.error("[v0] Error loading daily report:", error)
        setEntries([])
        setReportStatus("draft")
      })

    return () => {
      isCancelled = true
    }
  }, [currentDate])
  // --- end live data ---

  // Resolve sprint + task IDs when sprints finish loading after edit is initiated
  useEffect(() => {
    if (!pendingEditEntry || loadingSprints || sprints.length === 0) return
    const sprint = sprints.find(s => s.name === pendingEditEntry.sprint)
    if (sprint) {
      setSelectedSprintId(sprint.id)
      const task = sprint.tasks.find(t => t.title === pendingEditEntry.task)
      if (task) setSelectedTaskId(task.id)
    }
    setPendingEditEntry(null)
  }, [sprints, loadingSprints, pendingEditEntry])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
  }

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0)
  const isValidHours = hours ? (parseFloat(hours) >= 0.25 && parseFloat(hours) <= 10) : true

  const handleAddEntry = async (e: React.FormEvent) => {
    // debugger;
    e.preventDefault()

    if (!selectedClientId || !selectedSprintId || !selectedTaskId || !hours || !description.trim()) {
      alert("Please fill in all fields")
      return
    }

    if (!isValidHours) {
      alert("Hours must be between 0.25 and 10")
      return
    }

    if (description.trim().length < 10) {
      alert("Description must be at least 10 characters")
      return
    }

    const clientName = clients.find(c => c.id === selectedClientId)?.name || ""
    const sprintObj = sprints.find(s => s.id === selectedSprintId)
    const sprintName = sprintObj?.name || ""
    const taskTitle = sprintObj?.tasks.find(t => t.id === selectedTaskId)?.title || ""

    setSavingEntry(true)
    try {
      const token = localStorage.getItem("sessionToken")
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      // Step 1: Get or create daily report for today
      const reportRes = await fetch(`/api/daily-reports?date=${currentDate}`, { headers })
      if (!reportRes.ok) {
        const error = await reportRes.json().catch(() => null)
        throw new Error(error?.error || `Failed to get/create daily report (${reportRes.status})`)
      }
      const reportData = await reportRes.json()
      const reportId = reportData.report?.id

      if (!reportId) {
        throw new Error("Could not get report ID")
      }

      // Step 2: Save time entry to database
      const entryRes = await fetch(`/api/daily-reports/${reportId}/time-entries`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          client_id: selectedClientId,
          sprint_id: selectedSprintId,
          task_id: selectedTaskId,
          hours: parseFloat(hours),
          description: description.trim(),
        }),
      })

      if (!entryRes.ok) {
        const error = await entryRes.json()
        throw new Error(error.error || "Failed to save entry")
      }

      const savedEntry = await entryRes.json()

      // Step 3: Update local state to reflect the saved entry
      setEntries((currentEntries) => [
        ...currentEntries,
        {
          id: savedEntry.id,
          client: clientName,
          sprint: sprintName,
          task: taskTitle,
          hours: parseFloat(hours),
          description: description.trim(),
        },
      ])

      // Reset form
      setSelectedClientId("")
      setSelectedSprintId("")
      setSelectedTaskId("")
      setHours("")
      setDescription("")

      alert("Entry saved successfully!")
    } catch (error) {
      console.error("[v0] Error saving entry:", error)
      alert(`Failed to save entry: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setSavingEntry(false)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    setDeletingId(id)
    try {
      const token = localStorage.getItem("sessionToken")
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      // Get the report ID for the current date
      const reportRes = await fetch(`/api/daily-reports?date=${currentDate}`, { headers })
      if (!reportRes.ok) {
        const error = await reportRes.json().catch(() => null)
        throw new Error(error?.error || `Failed to get report (${reportRes.status})`)
      }
      const reportData = await reportRes.json()
      const reportId = reportData.report?.id

      if (!reportId) {
        throw new Error("Could not get report ID")
      }

      // Delete the entry
      const deleteRes = await fetch(`/api/daily-reports/${reportId}/time-entries/${id}`, {
        method: "DELETE",
        headers,
      })

      if (!deleteRes.ok) {
        const error = await deleteRes.json()
        throw new Error(error.error || "Failed to delete entry")
      }

      // Update local state
      setEntries((currentEntries) => currentEntries.filter(e => e.id !== id))
      alert("Entry deleted successfully!")
    } catch (error) {
      console.error("[v0] Error deleting entry:", error)
      alert(`Failed to delete entry: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setDeletingId(null)
    }
  }

  const handleEditEntry = (entry: TimeEntry) => {
    const client = clients.find(c => c.name === entry.client)
    if (client) setSelectedClientId(client.id)
    // sprints will reload via useEffect; once loaded find matching sprint/task
    setHours(entry.hours.toString())
    setDescription(entry.description)
    setEditingId(entry.id)
    // Sprint + task IDs are resolved after sprints load (see editingId effect below)
    setPendingEditEntry(entry)
  }

  const navigateDate = (days: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + days)
    setCurrentDate(newDate.toISOString().split("T")[0])
  }

  const handleSubmitReport = () => {
    if (entries.length === 0) {
      alert("Please add at least one time entry before submitting")
      return
    }
    if (totalHours < 4) {
      alert("Please log at least 4 hours of work")
      return
    }
    setReportStatus("submitted")
    setShowSubmitModal(false)
  }

  const filteredSprints = sprints
  const filteredTasks = selectedSprintId
    ? (sprints.find(s => s.id === selectedSprintId)?.tasks || [])
    : []

  const [viewBy, setViewBy] = useState<"client" | "task" | "sprint">("client")
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const buildClientSummary = (clientName: string, clientEntries: TimeEntry[]) => {
    const clientHours = clientEntries.reduce((s, e) => s + e.hours, 0)
    const lines = [`${clientName} — ${clientHours.toFixed(1)}h`]
    clientEntries.forEach(e => {
      lines.push(`  • ${e.task} (${e.sprint}) — ${e.hours}h`)
      if (e.description) lines.push(`    ${e.description}`)
    })
    return lines.join("\n")
  }

  const buildAllEntriesSummary = () => {
    return entries
      .map(e => `[${e.client}] ${e.task} | ${e.sprint} | ${e.hours}h | ${e.description}`)
      .join("\n")
  }

  // Grouped data for display
  const groupedByClient = entries.reduce((acc, entry) => {
    if (!acc[entry.client]) acc[entry.client] = []
    acc[entry.client].push(entry)
    return acc
  }, {} as Record<string, TimeEntry[]>)

  const groupedByTask = entries.reduce((acc, entry) => {
    if (!acc[entry.task]) acc[entry.task] = []
    acc[entry.task].push(entry)
    return acc
  }, {} as Record<string, TimeEntry[]>)

  const groupedBySprint = entries.reduce((acc, entry) => {
    if (!acc[entry.sprint]) acc[entry.sprint] = []
    acc[entry.sprint].push(entry)
    return acc
  }, {} as Record<string, TimeEntry[]>)

  // Time breakdown aggregations
  const timeByClient = entries.reduce((acc, entry) => {
    const existing = acc.find(item => item.name === entry.client)
    if (existing) { existing.hours += entry.hours } else { acc.push({ name: entry.client, hours: entry.hours }) }
    return acc
  }, [] as { name: string; hours: number }[])

  const timeBySprint = entries.reduce((acc, entry) => {
    const existing = acc.find(item => item.name === entry.sprint)
    if (existing) { existing.hours += entry.hours } else { acc.push({ name: entry.sprint, hours: entry.hours }) }
    return acc
  }, [] as { name: string; hours: number }[])

  const timeByTask = entries.reduce((acc, entry) => {
    const existing = acc.find(item => item.name === entry.task)
    if (existing) { existing.hours += entry.hours } else { acc.push({ name: entry.task, hours: entry.hours }) }
    return acc
  }, [] as { name: string; hours: number }[])

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar currentPhase="daily-report" onPhaseChange={() => { }} />
        <div className="flex-1 flex flex-col">
          <TopNav />
          <main className="flex-1 overflow-auto">
            <div className="min-h-screen bg-gradient-to-br from-[#F5F5F7] to-[#EFEFEF] ml-[260px]">
              {/* Breadcrumbs */}
              <BreadcrumbTrail
                items={[
                  { label: "Home", onClick: () => window.location.href = "/" },
                  { label: "Daily Work", active: true },
                ]}
              />
              {/* Header */}
              <div className="sticky top-0 z-40 bg-white border-b border-[#E5E5E7] shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-black text-[#1D1D1F]">Daily Work Report</h1>
                      <p className="text-sm text-[#86868B] mt-1">Track your daily time and activities</p>
                    </div>
                    <div className="flex gap-2">
                      {reportStatus === "draft" && (
                        <button
                          onClick={() => setShowSubmitModal(true)}
                          disabled={entries.length === 0}
                          className="flex items-center gap-2 px-4 py-2 bg-[#007AFF] text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium text-sm transition-all"
                        >
                          <Send className="w-4 h-4" />
                          Submit Report
                        </button>
                      )}
                      {reportStatus === "submitted" && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#34C759] bg-opacity-10 text-[#34C759] rounded-lg font-medium text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          Submitted
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date Navigation */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => navigateDate(-1)}
                      className="p-2 hover:bg-[#F5F5F7] rounded-lg transition-colors text-[#6B7280]"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F7] rounded-lg min-w-[300px] justify-center">
                      <Calendar className="w-4 h-4 text-[#86868B]" />
                      <span className="text-sm font-medium text-[#1D1D1F]">{formatDate(currentDate)}</span>
                    </div>
                    <button
                      onClick={() => navigateDate(1)}
                      className="p-2 hover:bg-[#F5F5F7] rounded-lg transition-colors text-[#6B7280]"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              {activeTab === "personal" ? (
                <div className="max-w-6xl mx-auto px-6 py-8">
                  {/* Pomodoro Tracked Sessions - Reference Section */}
                  {currentDate === new Date().toISOString().split("T")[0] && (
                    <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-green-900">Pomodoro Sessions Today</h3>
                          <p className="text-sm text-green-700 mt-1">Reference tracked time to assist report submission</p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-black text-green-600">{trackedHours.toFixed(1)}h</div>
                          <p className="text-xs text-green-600 font-medium">{todaySessions.length} sessions tracked</p>
                        </div>
                      </div>

                      {loadingTodaySessions ? (
                        <div className="py-6 text-center">
                          <p className="text-sm text-green-700">Loading Pomodoro sessions...</p>
                        </div>
                      ) : todaySessions.length === 0 ? (
                        <div className="py-6 text-center">
                          <p className="text-sm text-green-700">No Pomodoro sessions captured yet</p>
                          <p className="text-xs text-green-600 mt-1">Start a timer on a task to capture time automatically to your daily report</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                            {(showAllPomodoroSessions ? todaySessions : todaySessions.slice(0, 3)).map((session, idx) => (
                              <div key={session.id} className="bg-white rounded-lg p-3 border border-green-100 hover:border-green-300 transition-colors">
                                <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Session {idx + 1}</div>
                                <div className="text-sm font-mono font-bold text-gray-800">{formatTime(session.duration_seconds || 0)}</div>
                                <p className="text-xs text-gray-600 mt-1">{session.task_title}</p>
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="inline-block bg-blue-50 px-2 py-0.5 rounded text-blue-700">{session.client_name}</span>
                                </div>
                              </div>
                            ))}
                            {todaySessions.length > 3 && !showAllPomodoroSessions && (
                              <button
                                type="button"
                                onClick={() => setShowAllPomodoroSessions(true)}
                                className="bg-white rounded-lg p-3 border border-green-100 hover:border-green-300 transition-colors flex items-center justify-center"
                              >
                                <div className="text-center">
                                  <div className="text-2xl font-black text-green-600">+{todaySessions.length - 3}</div>
                                  <p className="text-xs text-gray-600 mt-1">More sessions</p>
                                </div>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <span>💡</span> Use these tracked sessions as a reference when filling your time entries
                            </p>
                            <div className="text-right flex items-center gap-3">
                              {todaySessions.length > 3 && showAllPomodoroSessions && (
                                <button
                                  type="button"
                                  onClick={() => setShowAllPomodoroSessions(false)}
                                  className="text-xs font-medium text-green-700 hover:text-green-900"
                                >
                                  Show less
                                </button>
                              )}
                              <div className="text-sm font-mono font-bold text-green-700">{trackedHours.toFixed(2)}h total</div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* HERO SECTION */}
                  <div className="mb-8 pt-2">
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <div className="text-6xl font-black text-[#1D1D1F] leading-tight">
                          {totalHours.toFixed(1)}
                          <span className="text-2xl ml-2 font-semibold text-[#86868B]">hours</span>
                        </div>
                        <p className="text-sm text-[#86868B] mt-3">
                          {entries.length} {entries.length === 1 ? "entry" : "entries"} •{" "}
                          {new Set(entries.map(e => e.client)).size} {new Set(entries.map(e => e.client)).size === 1 ? "client" : "clients"} •{" "}
                          <span className={cn("font-medium", reportStatus === "submitted" ? "text-[#34C759]" : "text-[#FF9500]")}>
                            {reportStatus === "submitted" ? "Submitted" : "Draft"}
                          </span>
                        </p>
                      </div>
                      {reportStatus === "draft" && (
                        <button
                          onClick={() => setShowSubmitModal(true)}
                          disabled={entries.length === 0}
                          className="px-6 py-3 bg-[#007AFF] text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-semibold text-sm transition-all flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Submit Report
                        </button>
                      )}
                    </div>
                  </div>

                  {/* TIME DISTRIBUTION BY CLIENT */}
                  {entries.length > 0 && (
                    <div className="mb-8 pb-6 border-b border-[#E5E5E7]">
                      <h3 className="text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-4">Time Distribution</h3>
                      <div className="space-y-3">
                        {timeByClient.map(({ name, hours }) => {
                          const percentage = (hours / totalHours) * 100
                          return (
                            <div key={name} className="flex items-center gap-4">
                              <div className="w-32 text-sm font-medium text-[#1D1D1F] truncate" title={name}>
                                {name}
                              </div>
                              <div className="flex-1 h-2 bg-[#F5F5F7] rounded-full overflow-hidden">
                                <div className="h-full bg-[#007AFF] rounded-full" style={{ width: `${percentage}%` }} />
                              </div>
                              <div className="w-12 text-right text-sm font-semibold text-[#007AFF]">
                                {hours.toFixed(1)}h
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* MAIN 2-COLUMN LAYOUT */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Form (30%) */}
                    <div className="lg:col-span-1">
                      <div className="sticky top-24">
                        <h2 className="text-sm font-bold text-[#1D1D1F] mb-4">Add Time Entry</h2>
                        <form
                          onSubmit={handleAddEntry}
                          className="space-y-4 bg-white rounded-xl shadow-sm border border-[#E5E5E7] p-6"
                        >
                          {/* Client Selection */}
                          <div>
                            <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-2">
                              Client
                            </label>
                            <select
                              value={selectedClientId}
                              onChange={(e) => {
                                setSelectedClientId(e.target.value)
                                setSelectedSprintId("")
                                setSelectedTaskId("")
                              }}
                              className="w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent text-sm bg-white text-[#1D1D1F]"
                            >
                              <option value="">{loadingClients ? "Loading clients…" : "Select a client"}</option>
                              {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                  {client.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Sprint Selection */}
                          <div>
                            <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-2">
                              Sprint
                            </label>
                            <select
                              value={selectedSprintId}
                              onChange={(e) => {
                                setSelectedSprintId(e.target.value)
                                setSelectedTaskId("")
                              }}
                              disabled={!selectedClientId || loadingSprints}
                              className="w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent text-sm bg-white text-[#1D1D1F] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">{loadingSprints ? "Loading sprints…" : "Select a sprint"}</option>
                              {filteredSprints.map(sprint => (
                                <option key={sprint.id} value={sprint.id}>
                                  {sprint.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Task Selection */}
                          <div>
                            <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-2">
                              Task
                            </label>
                            <select
                              value={selectedTaskId}
                              onChange={(e) => setSelectedTaskId(e.target.value)}
                              disabled={!selectedSprintId}
                              className="w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent text-sm bg-white text-[#1D1D1F] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">Select a task</option>
                              {filteredTasks.map(task => (
                                <option key={task.id} value={task.id}>
                                  {task.title}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Hours */}
                          <div>
                            <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-2">
                              Hours Spent
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0.25"
                                max="10"
                                step="0.25"
                                value={hours}
                                onChange={(e) => setHours(e.target.value)}
                                placeholder="e.g., 2.5"
                                className={cn(
                                  "w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-sm bg-white text-[#1D1D1F]",
                                  isValidHours ? "border-[#E5E5E7] focus:ring-[#007AFF]" : "border-[#FF3B30] focus:ring-[#FF3B30]"
                                )}
                              />
                              <Clock className="absolute right-3 top-3 w-4 h-4 text-[#86868B] pointer-events-none" />
                            </div>
                            {hours && !isValidHours && (
                              <p className="text-xs text-[#FF3B30] mt-1">Hours must be between 0.25 and 10</p>
                            )}
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-2">
                              Work Description (min 10 chars)
                            </label>
                            <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Describe what you worked on..."
                              className="w-full px-3 py-2.5 border border-[#E5E5E7] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent text-sm bg-white text-[#1D1D1F] resize-none h-24"
                            />
                            <p className="text-xs text-[#86868B] mt-1">
                              {description.length}/10 characters
                            </p>
                          </div>

                          {/* Submit Button */}
                          <button
                            type="submit"
                            disabled={reportStatus === "submitted" || savingEntry}
                            className="w-full px-4 py-2.5 bg-[#007AFF] text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium text-sm transition-all flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            {savingEntry ? "Saving..." : editingId ? "Update Entry" : "Add Entry"}
                          </button>

                          {editingId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null)
                                setSelectedClientId("")
                                setSelectedSprintId("")
                                setSelectedTaskId("")
                                setHours("")
                                setDescription("")
                              }}
                              className="w-full px-4 py-2 border border-[#E5E5E7] text-[#1D1D1F] rounded-lg hover:bg-[#F5F5F7] font-medium text-sm transition-all"
                            >
                              Cancel
                            </button>
                          )}
                        </form>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Execution Feed (70%) */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-lg p-1">
                          {(["client", "task", "sprint"] as const).map(v => (
                            <button
                              key={v}
                              onClick={() => setViewBy(v)}
                              className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize",
                                viewBy === v
                                  ? "bg-white text-[#1D1D1F] shadow-sm"
                                  : "text-[#86868B] hover:text-[#1D1D1F]"
                              )}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                        {entries.length > 0 && (
                          <button
                            onClick={() => copyToClipboard(buildAllEntriesSummary(), "all")}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] border border-[#E5E5E7] rounded-lg hover:bg-[#F5F5F7] transition-all"
                          >
                            {copiedKey === "all" ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedKey === "all" ? "Copied!" : "Copy All"}
                          </button>
                        )}
                      </div>

                      {/* Entries grouped */}
                      {entries.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E7] p-12 text-center">
                          <Clock className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3 opacity-50" />
                          <p className="text-[#86868B] font-medium">No time entries yet</p>
                          <p className="text-xs text-[#BDBDBE] mt-1">Add your first entry to get started</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(
                            viewBy === "client" ? groupedByClient
                              : viewBy === "task" ? groupedByTask
                                : groupedBySprint
                          ).map(([groupLabel, groupEntries]) => {
                            const groupHours = groupEntries.reduce((s, e) => s + e.hours, 0)
                            const copyKey = `group-${groupLabel}`
                            return (
                              <div key={groupLabel} className="bg-white rounded-xl shadow-sm border border-[#E5E5E7] overflow-hidden">
                                {/* Group Header */}
                                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F5F5F7] bg-[#FAFAFA]">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-[#1D1D1F]">{groupLabel}</span>
                                    <span className="text-xs font-semibold text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded-full">
                                      {groupHours.toFixed(1)}h
                                    </span>
                                    <span className="text-xs text-[#86868B]">{groupEntries.length} {groupEntries.length === 1 ? "entry" : "entries"}</span>
                                  </div>
                                  {viewBy === "client" && (
                                    <button
                                      onClick={() => copyToClipboard(buildClientSummary(groupLabel, groupEntries), copyKey)}
                                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] border border-[#E5E5E7] rounded-lg hover:bg-white transition-all"
                                    >
                                      {copiedKey === copyKey ? <Check className="w-3 h-3 text-[#34C759]" /> : <Copy className="w-3 h-3" />}
                                      {copiedKey === copyKey ? "Copied!" : "Copy"}
                                    </button>
                                  )}
                                </div>

                                {/* Entries in group */}
                                <div className="divide-y divide-[#F5F5F7]">
                                  {groupEntries.map(entry => (
                                    <div key={entry.id} className="px-5 py-4 hover:bg-[#FAFAFA] transition-colors">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="shrink-0 text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 px-2 py-0.5 rounded">
                                              {entry.hours}h
                                            </span>
                                            <p className="text-sm font-semibold text-[#1D1D1F] truncate">{entry.task}</p>
                                          </div>

                                          {/* Tab Toggle */}
                                          <div className="flex items-center gap-1 bg-[#F5F5F7] rounded-lg p-1 w-fit">
                                            <button
                                              onClick={() => setActiveTab("personal")}
                                              className={cn(
                                                "px-4 py-2 rounded-md font-semibold text-sm transition-all",
                                                activeTab === "personal"
                                                  ? "bg-white text-[#1D1D1F] shadow-sm"
                                                  : "text-[#86868B] hover:text-[#1D1D1F]"
                                              )}
                                            >
                                              Personal Work
                                            </button>
                                            <button
                                              onClick={() => setActiveTab("team")}
                                              className={cn(
                                                "px-4 py-2 rounded-md font-semibold text-sm transition-all flex items-center gap-2",
                                                activeTab === "team"
                                                  ? "bg-white text-[#1D1D1F] shadow-sm"
                                                  : "text-[#86868B] hover:text-[#1D1D1F]"
                                              )}
                                            >
                                              <Users className="w-4 h-4" />
                                              Team Work
                                            </button>
                                          </div>
                                        </div>
                                        <p className="text-xs text-[#86868B] mb-1.5">
                                          {viewBy !== "client" && <span className="mr-2">{entry.client}</span>}
                                          {viewBy !== "sprint" && <span className="text-[#BDBDBE]">{entry.sprint}</span>}
                                        </p>
                                        {entry.description && (
                                          <p className="text-xs text-[#6B7280] leading-relaxed">{entry.description}</p>
                                        )}
                                      </div>
                                      <div className="flex shrink-0 gap-1">
                                        <button
                                          onClick={() => handleEditEntry(entry)}
                                          disabled={reportStatus === "submitted"}
                                          className="p-1.5 hover:bg-[#F5F5F7] rounded-lg transition-colors text-[#6B7280] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteEntry(entry.id)}
                                          disabled={reportStatus === "submitted" || deletingId === entry.id}
                                          className="p-1.5 hover:bg-[#FEE2E2] rounded-lg transition-colors text-[#EF4444] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {deletingId === entry.id ? (
                                            <div className="w-3.5 h-3.5 border-2 border-[#EF4444] border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                    // </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-6xl mx-auto px-6 py-8">
                  <TeamWorkView date={currentDate} />
                </div>
              )}

              {/* Submit Modal */}
              {showSubmitModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                    <h2 className="text-xl font-black text-[#1D1D1F] mb-4">Submit Daily Report?</h2>
                    <div className="bg-[#F5F5F7] rounded-lg p-4 mb-6">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#86868B]">Total Hours:</span>
                          <span className="font-semibold text-[#1D1D1F]">{totalHours.toFixed(1)} hours</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#86868B]">Entries:</span>
                          <span className="font-semibold text-[#1D1D1F]">{entries.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#86868B]">Date:</span>
                          <span className="font-semibold text-[#1D1D1F]">{formatDate(currentDate)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-[#86868B] mb-6">
                      Once submitted, you won&apos;t be able to edit this report. Make sure all information is correct.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowSubmitModal(false)}
                        className="flex-1 px-4 py-2 border border-[#E5E5E7] text-[#1D1D1F] rounded-lg hover:bg-[#F5F5F7] font-medium text-sm transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitReport}
                        className="flex-1 px-4 py-2 bg-[#007AFF] text-white rounded-lg hover:opacity-90 font-medium text-sm transition-all"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* </div> */}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
