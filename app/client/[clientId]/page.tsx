"use client"

import { CheckCircle2, Calendar, BarChart3, Share2, FileText, MessageSquare, TrendingUp, ChevronDown, Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR, { mutate } from "swr"
import { AuthGuard } from "@/components/auth-guard"
import { TopNav } from "@/components/top-nav"
import { Sidebar } from "@/components/sidebar"

const fetcher = (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then((res) => res.json())
}

// Generate weeks for a given month string "YYYY-MM"
function generateWeeks(selectedMonth: string) {
  const [year, month] = selectedMonth.split("-").map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const weeks: { value: string; label: string }[] = []
  let currentDate = new Date(firstDay)
  const dayOfWeek = currentDate.getDay()
  const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  currentDate = new Date(currentDate.setDate(diff))
  let weekNum = 1
  while (currentDate <= lastDay) {
    const weekStart = new Date(currentDate)
    const weekEnd = new Date(currentDate)
    weekEnd.setDate(weekEnd.getDate() + 5)
    if (weekStart <= lastDay && weekEnd >= firstDay) {
      weeks.push({
        value: `week-${weekNum}`,
        label: `Week ${weekNum} (${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`,
      })
      weekNum++
    }
    currentDate.setDate(currentDate.getDate() + 7)
  }
  return weeks
}

export default function ClientReportPage({ params }: { params: { clientId: string } }) {
  const router = useRouter()
  const [selectedClientId, setSelectedClientId] = useState<string>(params.clientId || "")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [selectedWeek, setSelectedWeek] = useState("all")
  const [copied, setCopied] = useState(false)

  // Fetch all clients
  const { data: clientsData, isLoading: clientsLoading } = useSWR("/api/clients", fetcher)
  const clients: { id: string; name: string }[] = clientsData?.clients || []

  // Fetch report card for selected client (campaigns + posts)
  const { data: reportData, isLoading: reportLoading } = useSWR(
    selectedClientId ? `/api/client-report-card?clientId=${selectedClientId}` : null,
    fetcher
  )

  // Fetch tasks for selected client
  const { data: tasksData, isLoading: tasksLoading } = useSWR(
    selectedClientId ? `/api/tasks?clientId=${selectedClientId}` : null,
    fetcher
  )

  const selectedClient = clients.find((c) => c.id === selectedClientId)
  const weeks = generateWeeks(selectedMonth)

  const summary = reportData?.summary || {}
  const recentPosts: any[] = reportData?.recentPosts || []
  const campaigns: any[] = reportData?.campaigns || []
  const allTasks: any[] = tasksData?.tasks || tasksData || []

  // Filter tasks by selected month
  const filteredTasks = allTasks.filter((t: any) => {
    if (!t.due_date && !t.created_at) return true
    const dateStr = t.due_date || t.created_at
    const d = new Date(dateStr)
    const taskMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    return taskMonth === selectedMonth
  })

  const completedTasks = filteredTasks.filter((t: any) => t.status === "completed" || t.status === "done").length
  const totalTasks = filteredTasks.length
  const publishedCount = summary.publishedPosts || 0
  const scheduledCount = summary.scheduledPostsCount || 0
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const isLoading = reportLoading || tasksLoading

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleClientChange = (id: string) => {
    setSelectedClientId(id)


    // force SWR refresh immediately
    mutate(`/api/client-report-card?clientId=${id}`)
    mutate(`/api/tasks?clientId=${id}`)

    router.replace(`/client/${id}`)
  }

  // Build month options: last 3 months + current + next 2
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - 3 + i)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    return { value: val, label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }) }
  })

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-white w-full">
        <Sidebar currentPhase="client-dashboards" onPhaseChange={() => { }} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav />
          <main className="flex-1 overflow-auto">
            {/* Header — constrained within the flex-1 column, not full viewport */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <div className="px-6 py-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold mb-1">
                      {clientsLoading ? "Loading..." : selectedClient?.name || "Select a Client"}
                    </h1>
                    <p className="text-blue-100 text-base">Monthly Progress Report</p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    {copied ? "Copied!" : "Share Report"}
                  </button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-blue-100 text-xs font-medium mb-1.5">Select Client</label>
                    <div className="relative">
                      <select
                        value={selectedClientId}
                        onChange={(e) => handleClientChange(e.target.value)}
                        className="w-full px-3 py-2 bg-blue-700 text-white rounded-lg border border-blue-500 focus:outline-none focus:border-white appearance-none cursor-pointer text-sm"
                      >
                        <option value="" className="bg-blue-700">-- Select Client --</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id} className="bg-blue-700">
                            {client.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-100 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-blue-100 text-xs font-medium mb-1.5">Month</label>
                    <div className="relative">
                      <select
                        value={selectedMonth}
                        onChange={(e) => { setSelectedMonth(e.target.value); setSelectedWeek("all") }}
                        className="w-full px-3 py-2 bg-blue-700 text-white rounded-lg border border-blue-500 focus:outline-none focus:border-white appearance-none cursor-pointer text-sm"
                      >
                        {monthOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-blue-700">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-100 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-blue-100 text-xs font-medium mb-1.5">Period</label>
                    <div className="relative">
                      <select
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                        className="w-full px-3 py-2 bg-blue-700 text-white rounded-lg border border-blue-500 focus:outline-none focus:border-white appearance-none cursor-pointer text-sm"
                      >
                        <option value="all" className="bg-blue-700">Monthly View</option>
                        {weeks.map((week) => (
                          <option key={week.value} value={week.value} className="bg-blue-700">
                            {week.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-100 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex items-end pb-1">
                    <p className="text-blue-100 text-xs">
                      {selectedWeek === "all" ? "Showing full month" : "Showing specific week"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="px-6 py-10">
              {reportLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-3 text-gray-500">Loading report data...</span>
                </div>
              )}

              {!reportLoading && selectedClientId && (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-600 font-semibold text-sm">Completed Campaigns</span>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{completedTasks}</p>
                      <p className="text-sm text-green-700 mt-1">of {totalTasks} total</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-600 font-semibold text-sm">Completion Rate</span>
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{completionPercentage}%</p>
                      <div className="w-full bg-blue-200 rounded-full h-2 mt-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-600 font-semibold text-sm">Content Published</span>
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{publishedCount}</p>
                      <p className="text-sm text-purple-700 mt-1">posts live</p>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-amber-600 font-semibold text-sm">Scheduled Content</span>
                        <Calendar className="w-5 h-5 text-amber-600" />
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{scheduledCount}</p>
                      <p className="text-sm text-amber-700 mt-1">upcoming posts</p>
                    </div>
                  </div>

                  {/* Campaigns Section */}
                  {campaigns.length > 0 && (
                    <div className="mb-10">
                      <div className="mb-5">
                        <h2 className="text-xl font-bold text-gray-900">Campaigns</h2>
                        <p className="text-gray-500 text-sm mt-1">Active and completed campaigns for this client</p>
                      </div>
                      <div className="grid gap-3">
                        {campaigns.map((campaign: any) => (
                          <div
                            key={campaign.id}
                            className={`p-4 rounded-lg border-l-4 flex items-start justify-between ${campaign.status === "completed"
                              ? "bg-green-50 border-green-500"
                              : campaign.status === "active"
                                ? "bg-blue-50 border-blue-500"
                                : "bg-yellow-50 border-yellow-400"
                              }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${campaign.status === "completed"
                                    ? "bg-green-500"
                                    : campaign.status === "active"
                                      ? "bg-blue-500"
                                      : "bg-yellow-500"
                                    }`}
                                >
                                  {campaign.status === "completed" ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                  ) : (
                                    <TrendingUp className="w-3.5 h-3.5 text-white" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm">{campaign.name}</p>
                                  {campaign.platform && (
                                    <p className="text-xs text-gray-500">Platform: {campaign.platform}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ml-4 flex-shrink-0 capitalize ${campaign.status === "completed"
                                ? "bg-green-200 text-green-800"
                                : campaign.status === "active"
                                  ? "bg-blue-200 text-blue-800"
                                  : "bg-yellow-200 text-yellow-800"
                                }`}
                            >
                              {campaign.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Posts Section */}
                  {recentPosts.length > 0 && (
                    <div className="mb-10">
                      <div className="mb-5">
                        <h2 className="text-xl font-bold text-gray-900">Content & Social Media</h2>
                        <p className="text-gray-500 text-sm mt-1">Recent posts published and scheduled</p>
                      </div>
                      <div className="grid gap-3">
                        {recentPosts.map((post: any) => {
                          const platforms = Array.isArray(post.platforms)
                            ? post.platforms.join(", ")
                            : post.platform || "—"
                          return (
                            <div
                              key={post.id}
                              className={`p-4 rounded-lg border flex items-start justify-between ${post.status === "published"
                                ? "border-green-200 bg-green-50"
                                : post.status === "scheduled"
                                  ? "border-blue-200 bg-blue-50"
                                  : "border-gray-200 bg-gray-50"
                                }`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${post.status === "published"
                                      ? "bg-green-200 text-green-800"
                                      : post.status === "scheduled"
                                        ? "bg-blue-200 text-blue-800"
                                        : "bg-gray-200 text-gray-800"
                                      }`}
                                  >
                                    {platforms}
                                  </span>
                                </div>
                                <p className="font-semibold text-gray-900 text-sm">{post.caption || post.title || "—"}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {post.scheduled_date
                                    ? new Date(post.scheduled_date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                    : ""}
                                </p>
                              </div>
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold ml-4 flex-shrink-0 capitalize ${post.status === "published"
                                  ? "bg-green-200 text-green-800"
                                  : post.status === "scheduled"
                                    ? "bg-blue-200 text-blue-800"
                                    : "bg-gray-200 text-gray-800"
                                  }`}
                              >
                                {post.status}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Empty state when no data */}
                  {campaigns.length === 0 && recentPosts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                      <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
                      <p className="text-lg font-medium">No report data found</p>
                      <p className="text-sm mt-1">No campaigns or posts found for this client yet.</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t border-slate-200 pt-8 text-center text-gray-500">
                    <p className="text-sm">
                      Confidential report for {selectedClient?.name || "this client"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Questions? Contact your account manager directly.
                    </p>
                  </div>
                </>
              )}

              {!reportLoading && !selectedClientId && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <BarChart3 className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-lg font-medium">Select a client to view their report</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
