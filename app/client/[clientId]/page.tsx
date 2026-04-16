"use client"

import { CheckCircle2, Calendar, Users, Share2, Zap, TrendingUp, AlertCircle } from "lucide-react"
import { useState } from "react"

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
  const clientId = params.clientId
  const clientName = "Rudrani" // Dummy client name

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">{clientName}</h1>
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

        {/* Deliverables Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Deliverables</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dummyContent.map((content) => (
              <div key={content.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{content.title}</p>
                    <p className="text-sm text-gray-600">{content.platform}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${content.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>
                    {content.status === "published" ? "Published" : "Scheduled"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{content.date}</p>
              </div>
            ))}
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
