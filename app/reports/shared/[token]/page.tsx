"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Clock, Building2, Users, ChevronDown, ChevronUp } from "lucide-react"

interface ReportEntry {
  id: string
  report_date: string
  user_name: string
  client_name: string
  sprint_name: string
  task_title: string
  hours: number
  description: string
}

export default function SharedReportPage() {
  const params = useParams()
  const token = params?.token as string

  const [entries, setEntries] = useState<ReportEntry[]>([])
  const [summary, setSummary] = useState({ totalHours: 0, totalEntries: 0 })
  const [shareInfo, setShareInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!token) return

    fetch(`/api/reports/share?token=${token}`)
      .then(r => r.json())
      .then(async d => {
        if (!d.share) { setError("Report not found"); return }
        setShareInfo(d.share)

        const params = new URLSearchParams({
          dateFrom: d.share.date_from,
          dateTo: d.share.date_to,
        })
        if (d.share.client_id) params.set("clientId", d.share.client_id)
        if (d.share.user_id) params.set("userId", d.share.user_id)

        // shared reports use no-auth public read via token header
        const res = await fetch(`/api/reports/summary?${params}`, {
          headers: { "x-share-token": token },
        })
        const data = await res.json()
        setEntries(data.entries || [])
        setSummary(data.summary || { totalHours: 0, totalEntries: 0 })
        const groups = new Set<string>()
        ;(data.entries || []).forEach((e: ReportEntry) => groups.add(e.user_name))
        setExpandedGroups(groups)
      })
      .catch(() => setError("Failed to load report"))
      .finally(() => setLoading(false))
  }, [token])

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Group by user
  const grouped = (() => {
    const map = new Map<string, ReportEntry[]>()
    entries.forEach(e => {
      if (!map.has(e.user_name)) map.set(e.user_name, [])
      map.get(e.user_name)!.push(e)
    })
    return [...map.entries()].map(([name, ents]) => ({
      key: name,
      label: name,
      entries: ents,
      totalHours: ents.reduce((s, e) => s + e.hours, 0),
    }))
  })()

  const formatDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <p className="text-[#86868B]">Loading report...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E5E7] px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-[#86868B] mb-1">StoryOps — Shared Report</p>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">
            {shareInfo?.title || "Work Report"}
          </h1>
          {shareInfo && (
            <p className="text-sm text-[#86868B] mt-1">
              {formatDate(shareInfo.date_from)} — {formatDate(shareInfo.date_to)}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-6 space-y-4">
        {/* Summary cards */}
        <div className="flex gap-4">
          <div className="bg-white rounded-xl border border-[#E5E5E7] px-6 py-4 flex items-center gap-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-[#86868B]">Total Hours</p>
              <p className="text-xl font-bold text-[#1D1D1F]">{summary.totalHours.toFixed(1)}h</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E5E7] px-6 py-4 flex items-center gap-4">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-xs text-[#86868B]">Team Members</p>
              <p className="text-xl font-bold text-[#1D1D1F]">{new Set(entries.map(e => e.user_name)).size}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E5E7] px-6 py-4 flex items-center gap-4">
            <Building2 className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-xs text-[#86868B]">Clients</p>
              <p className="text-xl font-bold text-[#1D1D1F]">{new Set(entries.map(e => e.client_name)).size}</p>
            </div>
          </div>
        </div>

        {/* Grouped entries */}
        {grouped.map(group => (
          <div key={group.key} className="bg-white rounded-xl border border-[#E5E5E7] overflow-hidden">
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
            {expandedGroups.has(group.key) && (
              <div className="overflow-x-auto border-t border-[#E5E5E7]">
                <table className="w-full text-sm">
                  <thead className="bg-[#F5F5F7]">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#86868B] whitespace-nowrap">Date</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#86868B] whitespace-nowrap">Client</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#86868B] whitespace-nowrap">Sprint</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#86868B] whitespace-nowrap">Task</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-[#86868B]">Description</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#86868B]">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F7]">
                    {group.entries.map(entry => (
                      <tr key={entry.id} className="hover:bg-[#FAFAFA]">
                        <td className="px-4 py-3 text-[#86868B] whitespace-nowrap text-xs">{formatDate(entry.report_date)}</td>
                        <td className="px-4 py-3 text-[#1D1D1F] whitespace-nowrap text-xs">{entry.client_name}</td>
                        <td className="px-4 py-3 text-[#86868B] whitespace-nowrap text-xs">{entry.sprint_name}</td>
                        <td className="px-4 py-3 text-[#86868B] text-xs max-w-[160px] truncate">{entry.task_title}</td>
                        <td className="px-4 py-3 text-[#86868B] text-xs max-w-[260px]">{entry.description}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#1D1D1F] text-xs">{entry.hours.toFixed(1)}h</td>
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
  )
}
