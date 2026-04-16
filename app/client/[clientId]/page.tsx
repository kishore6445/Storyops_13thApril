"use client"

import { CheckCircle2, Calendar, Users, Share2, Zap, TrendingUp, AlertCircle, ChevronDown } from "lucide-react"
import { useState } from "react"

// Dummy clients list
const dummyClients = [
  { id: "client-1", name: "Rudrani" },
  { id: "client-2", name: "TechStart Inc" },
  { id: "client-3", name: "Fashion Forward" },
  { id: "client-4", name: "Green Solutions" },
]

const dummyTasks = [
  { id: 1, title: "Homepage Redesign", status: "done", assignee: "Sarah Johnson", dueDate: "2024-04-15" },
  { id: 2, title: "Logo Animation", status: "done", assignee: "Mike Chen", dueDate: "2024-04-18" },
  { id: 3, title: "Brand Guidelines", status: "done", assignee: "Emma Davis", dueDate: "2024-04-20" },
  { id: 4, title: "Social Media Kit", status: "done", assignee: "Alex Rivera", dueDate: "2024-04-22" },
  { id: 5, title: "Email Templates", status: "in_progress", assignee: "Sarah Johnson", dueDate: "2024-04-25" },
  { id: 6, title: "Landing Page Copy", status: "done", assignee: "Emma Davis", dueDate: "2024-04-10" },
  { id: 7, title: "Product Photography", status: "done", assignee: "Mike Chen", dueDate: "2024-04-12" },
  { id: 8, title: "Case Studies", status: "in_progress", assignee: "Alex Rivera", dueDate: "2024-04-28" },
  { id: 9, title: "User Testing Report", status: "done", assignee: "Sarah Johnson", dueDate: "2024-04-19" },
  { id: 10, title: "Performance Optimization", status: "done", assignee: "Mike Chen", dueDate: "2024-04-21" },
]

const dummyContent = [
  { id: 1, title: "10 Tips for Digital Marketing", platform: "LinkedIn", status: "published", date: "2024-04-15" },
  { id: 2, title: "Behind the Scenes: Our Process", platform: "Instagram", status: "published", date: "2024-04-16" },
  { id: 3, title: "Q2 Industry Trends", platform: "LinkedIn", status: "published", date: "2024-04-18" },
  { id: 4, title: "Summer Campaign Launch", platform: "Twitter", status: "scheduled", date: "2024-04-25" },
  { id: 5, title: "Customer Success Story", platform: "Instagram", status: "published", date: "2024-04-20" },
  { id: 6, title: "Webinar Announcement", platform: "LinkedIn", status: "scheduled", date: "2024-04-27" },
]

const dummyContentProduction = [
  { id: 1, title: "Q3 Strategy Video", status: "done", dueDate: "2024-04-12" },
  { id: 2, title: "Product Photoshoot", status: "done", dueDate: "2024-04-18" },
  { id: 3, title: "Infographic Design", status: "in_progress", dueDate: "2024-04-25" },
  { id: 4, title: "Blog Content Pack", status: "in_progress", dueDate: "2024-04-28" },
]

const accountManagerNotes = `
## Project Progress Summary

### Key Achievements This Month
• Successfully completed homepage redesign with improved user experience and conversion metrics
• Developed comprehensive brand guidelines ensuring consistency across all platforms
• Created professional social media kit with templates for consistent brand presence
• Completed product photography session with 50+ high-quality images for marketing materials
• User testing revealed 92% satisfaction rate with new design

### Performance Metrics
• Website traffic increased by 34% compared to last month
• Social media engagement rate up 28%
• Email open rates improved to 42% (industry average: 35%)
• Product pages seeing 3.5x more time on page

### Content Published
• 5 high-performing LinkedIn articles reaching 45K+ audience
• 3 Instagram posts generating 8,200+ engagements
• 2 Twitter threads with 12K+ impressions

### Next Steps & Recommendations
• Begin A/B testing on landing page CTAs
• Expand video content strategy
• Plan Q3 content calendar with seasonal campaigns
• Schedule monthly performance review meeting

### Team Performance
All deliverables completed on or ahead of schedule. Excellent collaboration between design, content, and development teams.
`

export default function ClientPage({ params }: { params: { clientId: string } }) {
  const [copied, setCopied] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState("client-1")
  const [selectedMonth, setSelectedMonth] = useState("2024-04")
  const [selectedWeek, setSelectedWeek] = useState("all")
  const [engagementNotes, setEngagementNotes] = useState("")
  
  const clientId = params.clientId
  const selectedClient = dummyClients.find(c => c.id === selectedClientId) || dummyClients[0]

  // Generate weeks for the selected month
  const generateWeeks = () => {
    const [year, month] = selectedMonth.split("-").map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const weeks = []
    
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
          label: `Week ${weekNum} (${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`
        })
        weekNum++
      }
      currentDate.setDate(currentDate.getDate() + 7)
    }
    return weeks
  }

  const weeks = generateWeeks()

  const completedTasks = dummyTasks.filter(t => t.status === "done").length
  const totalTasks = dummyTasks.length
  const completionRate = Math.round((completedTasks / totalTasks) * 100)
  const publishedContent = dummyContent.filter(c => c.status === "published").length
  const scheduledContent = dummyContent.filter(c => c.status === "scheduled").length

  const handleCopyLink = async () => {
    try {
      const url = `${typeof window !== "undefined" ? window.location.origin : ""}/client/${clientId}`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold">{selectedClient.name}</h1>
              <p className="text-blue-100 mt-2">April 2024 Project Report</p>
            </div>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              {copied ? "Copied!" : "Share Report"}
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Client Selector */}
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-2">Select Client</label>
              <div className="relative">
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full px-4 py-2 bg-blue-700 text-white rounded-lg border border-blue-500 focus:outline-none focus:border-white appearance-none cursor-pointer"
                >
                  {dummyClients.map(client => (
                    <option key={client.id} value={client.id} className="bg-blue-700">
                      {client.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-100 pointer-events-none" />
              </div>
            </div>

            {/* Month Selector */}
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-2">Month</label>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value)
                    setSelectedWeek("all")
                  }}
                  className="w-full px-4 py-2 bg-blue-700 text-white rounded-lg border border-blue-500 focus:outline-none focus:border-white appearance-none cursor-pointer"
                >
                  {["2024-02", "2024-03", "2024-04", "2024-05"].map(month => {
                    const date = new Date(month + "-01")
                    return (
                      <option key={month} value={month} className="bg-blue-700">
                        {date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </option>
                    )
                  })}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-100 pointer-events-none" />
              </div>
            </div>

            {/* Week Selector */}
            <div>
              <label className="block text-blue-100 text-sm font-medium mb-2">Week</label>
              <div className="relative">
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full px-4 py-2 bg-blue-700 text-white rounded-lg border border-blue-500 focus:outline-none focus:border-white appearance-none cursor-pointer"
                >
                  <option value="all" className="bg-blue-700">Monthly View</option>
                  {weeks.map(week => (
                    <option key={week.value} value={week.value} className="bg-blue-700">
                      {week.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-100 pointer-events-none" />
              </div>
            </div>

            {/* View Type Info */}
            <div className="flex items-end">
              <p className="text-blue-100 text-sm">
                {selectedWeek === "all" ? "Showing full month" : "Showing specific week"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* Completed Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 font-semibold">Completed Tasks</h3>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900">{completedTasks}</p>
            <p className="text-sm text-gray-600 mt-1">of {totalTasks} tasks</p>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 font-semibold">Completion Rate</h3>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900">{completionRate}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${completionRate}%` }}></div>
            </div>
          </div>

          {/* Published Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 font-semibold">Published</h3>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900">{publishedContent}</p>
            <p className="text-sm text-gray-600 mt-1">content pieces</p>
          </div>

          {/* Scheduled Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-700 font-semibold">Scheduled</h3>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900">{scheduledContent}</p>
            <p className="text-sm text-gray-600 mt-1">coming soon</p>
          </div>
        </div>

        {/* Accountability Section - Planned vs Completed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {selectedWeek === "all" ? "Monthly Accountability" : "Weekly Accountability"}
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            {selectedWeek === "all" 
              ? "Complete monthly overview of planned and completed deliverables"
              : "Track planned vs completed work for this specific week"}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Planned Work */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Planned Work</h3>
                  <p className="text-sm text-gray-600">Tasks assigned for this period</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-900">Sprint Tasks</p>
                    <span className="text-2xl font-bold text-blue-600">12</span>
                  </div>
                  <p className="text-sm text-gray-600">Total planned deliverables</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-400">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-900">Content Pieces</p>
                    <span className="text-2xl font-bold text-indigo-600">6</span>
                  </div>
                  <p className="text-sm text-gray-600">Social media & blog posts</p>
                </div>

                <div className="bg-white rounded-lg p-4 border-l-4 border-purple-400">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-900">Production Items</p>
                    <span className="text-2xl font-bold text-purple-600">4</span>
                  </div>
                  <p className="text-sm text-gray-600">Design, video, copywriting</p>
                </div>
              </div>
            </div>

            {/* Completed Work */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border-2 border-emerald-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Completed Work</h3>
                  <p className="text-sm text-gray-600">Tasks finished this period</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 border-l-4 border-emerald-500">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-900">Sprint Tasks</p>
                    <span className="text-2xl font-bold text-emerald-600">10</span>
                  </div>
                  <p className="text-sm text-gray-600">83% completion rate</p>
                </div>
                
                <div className="bg-white rounded-lg p-4 border-l-4 border-teal-400">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-900">Content Published</p>
                    <span className="text-2xl font-bold text-teal-600">4</span>
                  </div>
                  <p className="text-sm text-gray-600">67% of planned content</p>
                </div>

                <div className="bg-white rounded-lg p-4 border-l-4 border-green-400">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-900">Production Done</p>
                    <span className="text-2xl font-bold text-green-600">3</span>
                  </div>
                  <p className="text-sm text-gray-600">75% of production items</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Accountability Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Overall Completion</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "81%" }}></div>
                  </div>
                  <span className="font-bold text-gray-900">81%</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">On-Time Delivery</p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">92% delivered on time</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Items</p>
                <p className="text-2xl font-bold text-blue-600">2 tasks in progress</p>
              </div>
            </div>
          </div>
        </div>
          <div className="space-y-3">
            {dummyTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${task.status === "done" ? "bg-green-100" : "bg-yellow-100"}`}>
                    {task.status === "done" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{task.title}</p>
                    <p className="text-sm text-gray-600">{task.assignee}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${task.status === "done" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {task.status === "done" ? "Completed" : "In Progress"}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">{task.dueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Content & Social Media</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {dummyContent.map((content) => (
              <div key={content.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{content.title}</p>
                    <p className="text-sm text-gray-600">{content.platform}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${content.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
                    {content.status === "published" ? "Posted" : "Scheduled"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{content.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Content Production Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Content Production Status</h2>
          <div className="space-y-3">
            {dummyContentProduction.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${item.status === "done" ? "bg-green-100" : "bg-blue-100"}`}>
                    {item.status === "done" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">Due: {item.dueDate}</p>
                  </div>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${item.status === "done" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                  {item.status === "done" ? "Complete" : "In Progress"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Social Media Engagement Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Social Media Engagement Notes</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Add Engagement Notes & Insights</label>
              <textarea
                value={engagementNotes}
                onChange={(e) => setEngagementNotes(e.target.value)}
                placeholder="Document audience engagement, campaign performance, trending topics, recommended strategies for next period..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={6}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-blue-900">💡 Engagement Summary:</span> Average engagement rate 28%, LinkedIn outperforming other platforms by 42%, best performing content: industry trends articles, recommended: increase video content by 30% for Q3.
              </p>
            </div>
          </div>
        </div>

        {/* Account Manager Notes */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-sm border border-indigo-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Account Manager Review
          </h2>
          <div className="prose prose-sm max-w-none">
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {accountManagerNotes}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-600 text-sm">
          <p>For questions or clarifications, please contact your account manager.</p>
          <p className="mt-2 text-gray-500">Report generated on April 24, 2024</p>
        </div>
      </div>
    </div>
  )
}
