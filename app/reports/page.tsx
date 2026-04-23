"use client"

import { useState, useEffect, useCallback } from "react"
import { Calendar, Users, Building2, Search, Download, ChevronDown, ChevronUp, Clock } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { TopNav } from "@/components/top-nav"
import { Sidebar } from "@/components/sidebar"
import { BreadcrumbTrail } from "@/components/breadcrumb-trail"
import { cn } from "@/lib/utils"

interface ReportEntry {
  id: string
  report_date: string
  user_id: string
  user_name: string
  user_email: string
  client_id: string
  client_name: string
  sprint_name: string
  task_title: string
  hours: number
  description: string
}

interface SummaryData {
  totalHours: number
  totalEntries: number
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function ReportsPage() {
  // Default range: last 7 days
  const today = new Date().toISOString().split("T")[0]
  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const [dateFrom, setDateFrom] = useState(sevenDaysAgo)
  const [dateTo, setDateTo] = useState(today)
  const [selectedClientId, setSelectedClientId] = useState("")
  const [selectedUserId, setSelectedUserId] = useState("")

  const [entries, setEntries] = useState<ReportEntry[]>([])
  const [summary, setSummary] = useState<SummaryData>({ totalHours: 0, totalEntries: 0 })
  const [loading, setLoading] = useState(false)

  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([])

  // grouping: "user" | "client" | "none"
  const [groupBy, setGroupBy] = useState<"user" | "client" | "none">("user")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Load clients + users
  useEffect(() => {
    fetch("/api/clients", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setClients((d.clients || []).map((c: any) => ({ id: c.id, name: c.name }))))
      .catch(() => setClients([]))

    fetch("/api/users", { headers: authHeaders() })
      .then(r => r.json())
      .then(d => setUsers((d.users || []).map((u: any) => ({ id: u.id, name: u.full_name || u.email, email: u.email }))))
      .catch(() => setUsers([]))
  }, [])

  const fetchReport = useCallback(() => {
    if (!dateFrom || !dateTo) return
    setLoading(true)
    const params = new URLSearchParams({ dateFrom, dateTo })
    if (selectedClientId) params.set("clientId", selectedClientId)
    if (selectedUserId) params.set("userId", selectedUserId)

    fetch(`/api/reports/summary?${params}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => {
        setEntries(d.entries || [])
        setSummary(d.summary || { totalHours: 0, totalEntries: 0 })
        // Expand all groups by default
        const groups = new Set<string>()
        ;(d.entries || []).forEach((e: ReportEntry) => {
          groups.add(groupBy === "user" ? e.user_name : groupBy === "client" ? e.client_name : "all")
        })
        setExpandedGroups(groups)
      })
      .catch(() => { setEntries([]); setSummary({ totalHours: 0, totalEntries: 0 }) })
      .finally(() => setLoading(false))
  }, [dateFrom, dateTo, selectedClientId, selectedUserId, groupBy])

  // Auto-fetch on mount
  useEffect(() => { fetchReport() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Group entries
  const grouped: { key: string; label: string; entries: ReportEntry[]; totalHours: number }[] = (() => {
    if (groupBy === "none") {
      return [{ key: "all", label: "All Entries", entries, totalHours: entries.reduce((s, e) => s + e.hours, 0) }]
    }
    const map = new Map<string, ReportEntry[]>()
    entries.forEach(e => {
      const key = groupBy === "user" ? `${e.user_id}|${e.user_name}` : `${e.client_id}|${e.client_name}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    })
    return [...map.entries()].map(([key, ents]) => ({
      key,
      label: key.split("|")[1],
      entries: ents,
      totalHours: ents.reduce((s, e) => s + e.hours, 0),
    }))
  })()

  const formatDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar currentPhase="reports" onPhaseChange={() => {}} />
        <div className="flex-1 flex flex-col">
          <TopNav />
          <main className="flex-1 overflow-auto">
            <div className="min-h-screen bg-[#F5F5F7] ml-[260px] mt-16">
              <BreadcrumbTrail
                items={[
                  { label: "Home", onClick: () => window.location.href = "/" },
                  { label: "Reports", active: true },
                ]}
              />

              {/* Header */}
              <div className="bg-white border-b border-[#E5E5E7] px-8 py-6">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h1 className="text-2xl font-bold text-[#1D1D1F]">Work Reports</h1>
                    <p className="text-sm text-[#86868B] mt-0.5">Filter by date range, client, or team member and share with anyone</p>
                  </div>
                  <div />
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white border-b border-[#E5E5E7] px-8 py-4">
                <div className="flex flex-wrap items-end gap-4">
                  {/* Date From */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#86868B]">From</label>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-[#F5F5F7]">
                      <Calendar className="w-4 h-4 text-[#86868B]" />
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="text-sm text-[#1D1D1F] bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Date To */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#86868B]">To</label>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-[#F5F5F7]">
                      <Calendar className="w-4 h-4 text-[#86868B]" />
                      <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="text-sm text-[#1D1D1F] bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Client filter */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#86868B]">Client</label>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-[#F5F5F7]">
                      <Building2 className="w-4 h-4 text-[#86868B]" />
                      <select
                        value={selectedClientId}
                        onChange={e => setSelectedClientId(e.target.value)}
                        className="text-sm text-[#1D1D1F] bg-transparent focus:outline-none pr-2"
                      >
                        <option value="">All Clients</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* User filter */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#86868B]">Team Member</label>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-[#F5F5F7]">
                      <Users className="w-4 h-4 text-[#86868B]" />
                      <select
                        value={selectedUserId}
                        onChange={e => setSelectedUserId(e.target.value)}
                        className="text-sm text-[#1D1D1F] bg-transparent focus:outline-none pr-2"
                      >
                        <option value="">All Members</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Group by */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-[#86868B]">Group By</label>
                    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-[#F5F5F7]">
                      <select
                        value={groupBy}
                        onChange={e => setGroupBy(e.target.value as any)}
                        className="text-sm text-[#1D1D1F] bg-transparent focus:outline-none pr-2"
                      >
                        <option value="user">Team Member</option>
                        <option value="client">Client</option>
                        <option value="none">No Grouping</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={fetchReport}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2 bg-[#1D1D1F] text-white rounded-lg hover:bg-black disabled:opacity-50 text-sm font-medium transition-all"
                  >
                    <Search className="w-4 h-4" />
                    {loading ? "Loading..." : "Run Report"}
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="px-8 py-5 flex gap-4">
                <div className="bg-white rounded-xl border border-[#E5E5E7] px-6 py-4 flex items-center gap-4 shadow-sm">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-[#86868B]">Total Hours</p>
                    <p className="text-2xl font-bold text-[#1D1D1F]">{summary.totalHours.toFixed(1)}h</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-[#E5E5E7] px-6 py-4 flex items-center gap-4 shadow-sm">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Search className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-[#86868B]">Total Entries</p>
                    <p className="text-2xl font-bold text-[#1D1D1F]">{summary.totalEntries}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-[#E5E5E7] px-6 py-4 flex items-center gap-4 shadow-sm">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-[#86868B]">Team Members</p>
                    <p className="text-2xl font-bold text-[#1D1D1F]">{new Set(entries.map(e => e.user_id)).size}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-[#E5E5E7] px-6 py-4 flex items-center gap-4 shadow-sm">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-[#86868B]">Clients</p>
                    <p className="text-2xl font-bold text-[#1D1D1F]">{new Set(entries.map(e => e.client_id)).size}</p>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="px-8 pb-10 space-y-4">
                {loading && (
                  <div className="bg-white rounded-xl border border-[#E5E5E7] p-12 text-center">
                    <p className="text-[#86868B]">Loading report data...</p>
                  </div>
                )}

                {!loading && entries.length === 0 && (
                  <div className="bg-white rounded-xl border border-[#E5E5E7] p-12 text-center">
                    <p className="text-[#86868B]">No entries found for the selected filters.</p>
                    <p className="text-sm text-[#86868B] mt-1">Try expanding the date range or changing the filters.</p>
                  </div>
                )}

                {!loading && grouped.map(group => (
                  <div key={group.key} className="bg-white rounded-xl border border-[#E5E5E7] shadow-sm overflow-hidden">
                    {/* Group header */}
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F5F5F7] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                          {group.label.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-[#1D1D1F] text-sm">{group.label}</p>
                          <p className="text-xs text-[#86868B]">{group.entries.length} entries</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-[#1D1D1F]">{group.totalHours.toFixed(1)}h</span>
                        {expandedGroups.has(group.key)
                          ? <ChevronUp className="w-4 h-4 text-[#86868B]" />
                          : <ChevronDown className="w-4 h-4 text-[#86868B]" />
                        }
                      </div>
                    </button>

                    {/* Entries table */}
                    {expandedGroups.has(group.key) && (
                      <div className="overflow-x-auto border-t border-[#E5E5E7]">
                        <table className="w-full text-sm">
                          <thead className="bg-[#F5F5F7]">
                            <tr>
                              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#86868B] whitespace-nowrap">Date</th>
                              {groupBy !== "user" && <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#86868B] whitespace-nowrap">Member</th>}
                              {groupBy !== "client" && <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#86868B] whitespace-nowrap">Client</th>}
                              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#86868B] whitespace-nowrap">Sprint</th>
                              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#86868B] whitespace-nowrap">Task</th>
                              <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#86868B]">Description</th>
                              <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#86868B] whitespace-nowrap">Hours</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F5F5F7]">
                            {group.entries.map(entry => (
                              <tr key={entry.id} className="hover:bg-[#FAFAFA]">
                                <td className="px-4 py-3 text-[#86868B] whitespace-nowrap text-xs">{formatDate(entry.report_date)}</td>
                                {groupBy !== "user" && <td className="px-4 py-3 text-[#1D1D1F] font-medium whitespace-nowrap text-xs">{entry.user_name}</td>}
                                {groupBy !== "client" && <td className="px-4 py-3 text-[#1D1D1F] whitespace-nowrap text-xs">{entry.client_name}</td>}
                                <td className="px-4 py-3 text-[#86868B] whitespace-nowrap text-xs">{entry.sprint_name}</td>
                                <td className="px-4 py-3 text-[#86868B] whitespace-nowrap text-xs max-w-[180px] truncate">{entry.task_title}</td>
                                <td className="px-4 py-3 text-[#86868B] text-xs max-w-[280px]">{entry.description}</td>
                                <td className="px-4 py-3 text-right font-semibold text-[#1D1D1F] whitespace-nowrap text-xs">{entry.hours.toFixed(1)}h</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
