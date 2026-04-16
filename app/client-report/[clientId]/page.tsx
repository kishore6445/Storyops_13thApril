import { CheckCircle2, Calendar, Users, BarChart3, Share2, FileText, MessageSquare, TrendingUp } from "lucide-react"

interface ReportData {
  clientName: string
  month: string
  completedTasks: number
  totalTasks: number
  tasks: Array<{
    id: string
    title: string
    status: "completed" | "in_progress"
    dueDate: string
    assignee: string
  }>
  contentPosts: Array<{
    id: string
    platform: string
    title: string
    status: "published" | "scheduled" | "draft"
    date: string
  }>
  accountManagerNotes: string
}

const dummyReportData: ReportData = {
  clientName: "TechStartup Inc.",
  month: "April 2026",
  completedTasks: 24,
  totalTasks: 28,
  tasks: [
    {
      id: "1",
      title: "Landing page redesign and optimization",
      status: "completed",
      dueDate: "April 5",
      assignee: "Sarah Johnson",
    },
    {
      id: "2",
      title: "Mobile app UI/UX improvements",
      status: "completed",
      dueDate: "April 8",
      assignee: "Mike Chen",
    },
    {
      id: "3",
      title: "API integration for payment gateway",
      status: "completed",
      dueDate: "April 10",
      assignee: "Alex Rodriguez",
    },
    {
      id: "4",
      title: "Database optimization and indexing",
      status: "completed",
      dueDate: "April 12",
      assignee: "James Wilson",
    },
    {
      id: "5",
      title: "Security audit and vulnerability assessment",
      status: "completed",
      dueDate: "April 15",
      assignee: "Emily Parker",
    },
    {
      id: "6",
      title: "Analytics dashboard implementation",
      status: "completed",
      dueDate: "April 18",
      assignee: "David Kim",
    },
    {
      id: "7",
      title: "Email marketing automation setup",
      status: "completed",
      dueDate: "April 20",
      assignee: "Lisa Martinez",
    },
    {
      id: "8",
      title: "Social media integration",
      status: "completed",
      dueDate: "April 22",
      assignee: "Tom Brady",
    },
    {
      id: "9",
      title: "SEO optimization and keyword research",
      status: "in_progress",
      dueDate: "April 25",
      assignee: "Nina Patel",
    },
    {
      id: "10",
      title: "Performance testing and load optimization",
      status: "in_progress",
      dueDate: "April 28",
      assignee: "Chris Anderson",
    },
  ],
  contentPosts: [
    {
      id: "1",
      platform: "LinkedIn",
      title: "Company milestone: 10,000 users reached!",
      status: "published",
      date: "April 1",
    },
    {
      id: "2",
      platform: "Twitter",
      title: "New feature release: Advanced analytics",
      status: "published",
      date: "April 5",
    },
    {
      id: "3",
      platform: "Instagram",
      title: "Behind the scenes: Our team at work",
      status: "published",
      date: "April 8",
    },
    {
      id: "4",
      platform: "LinkedIn",
      title: "Industry insights: Future of AI in business",
      status: "published",
      date: "April 12",
    },
    {
      id: "5",
      platform: "Twitter",
      title: "Q2 roadmap announcement",
      status: "scheduled",
      date: "April 26",
    },
    {
      id: "6",
      platform: "Instagram",
      title: "Product feature highlight video",
      status: "scheduled",
      date: "April 28",
    },
  ],
  accountManagerNotes: `
    Excellent progress this month! TechStartup has made significant strides with their platform development.
    
    Key Highlights:
    • Successfully completed 24 out of 28 planned tasks (86% completion rate)
    • Landing page redesign resulted in 34% improvement in conversion rates
    • Mobile app now supports offline functionality
    • Payment integration completed ahead of schedule
    
    Content Performance:
    • LinkedIn posts averaging 2.5K impressions and 180 engagements
    • Twitter campaign reached 12K impressions with strong engagement
    • Instagram content resonating well with younger demographic
    
    Next Steps:
    • Complete remaining 2 in-progress tasks by April 30
    • Begin Q2 feature development sprint
    • Schedule performance review meeting for May 2
    
    Overall Status: ON TRACK ✓
    The team is performing exceptionally well and maintaining great communication. We're confident in meeting all Q2 objectives.
  `,
}

export default function ClientReportPage({ params }: { params: { clientId: string } }) {
  const data = dummyReportData

  const publishedCount = data.contentPosts.filter((p) => p.status === "published").length
  const scheduledCount = data.contentPosts.filter((p) => p.status === "scheduled").length
  const completionPercentage = Math.round((data.completedTasks / data.totalTasks) * 100)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-2">{data.clientName}</h1>
          <p className="text-blue-100 text-lg">Monthly Progress Report - {data.month}</p>
          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={() => {
                const url = window.location.href
                navigator.clipboard.writeText(url)
                alert("Link copied to clipboard!")
              }}
              className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              Share Report
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-600 font-semibold text-sm">Completed Tasks</span>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{data.completedTasks}</p>
            <p className="text-sm text-green-700 mt-1">of {data.totalTasks} total</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
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

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-600 font-semibold text-sm">Content Published</span>
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{publishedCount}</p>
            <p className="text-sm text-purple-700 mt-1">posts live</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-amber-600 font-semibold text-sm">Scheduled Content</span>
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{scheduledCount}</p>
            <p className="text-sm text-amber-700 mt-1">upcoming posts</p>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Completed Deliverables</h2>
            <p className="text-gray-600 mt-2">All sprint tasks completed this month by the team</p>
          </div>

          <div className="grid gap-3">
            {data.tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border-l-4 flex items-start justify-between ${
                  task.status === "completed"
                    ? "bg-green-50 border-green-500"
                    : "bg-yellow-50 border-yellow-500"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        task.status === "completed"
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    >
                      {task.status === "completed" ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-600">
                        Assigned to {task.assignee} • Due {task.dueDate}
                      </p>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ml-4 flex-shrink-0 ${
                    task.status === "completed"
                      ? "bg-green-200 text-green-800"
                      : "bg-yellow-200 text-yellow-800"
                  }`}
                >
                  {task.status === "completed" ? "Completed" : "In Progress"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Status Section */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Content & Social Media</h2>
            <p className="text-gray-600 mt-2">Content published and scheduled across platforms</p>
          </div>

          <div className="grid gap-3">
            {data.contentPosts.map((post) => (
              <div
                key={post.id}
                className={`p-4 rounded-lg border flex items-start justify-between ${
                  post.status === "published"
                    ? "border-green-200 bg-green-50"
                    : post.status === "scheduled"
                      ? "border-blue-200 bg-blue-50"
                      : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        post.status === "published"
                          ? "bg-green-200 text-green-800"
                          : post.status === "scheduled"
                            ? "bg-blue-200 text-blue-800"
                            : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {post.platform}
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900 mt-2">{post.title}</p>
                  <p className="text-sm text-gray-600">{post.date}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ml-4 flex-shrink-0 ${
                    post.status === "published"
                      ? "bg-green-200 text-green-800"
                      : post.status === "scheduled"
                        ? "bg-blue-200 text-blue-800"
                        : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Account Manager Review Section */}
        <div className="mb-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-6 h-6 text-slate-700" />
            <h2 className="text-2xl font-bold text-gray-900">Account Manager Review</h2>
          </div>
          <p className="text-sm font-semibold text-slate-600 mb-4">Monthly Summary & Next Steps</p>

          <div className="bg-white rounded-lg p-6 border border-slate-200">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {data.accountManagerNotes}
            </p>

            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Account Manager</p>
                  <p className="font-semibold text-gray-900">Rudrani Consulting Team</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Report Generated</p>
                  <p className="font-semibold text-gray-900">April 30, 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-8 text-center text-gray-600">
          <p className="text-sm">
            This is a confidential report created exclusively for {data.clientName}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Questions? Contact your account manager directly
          </p>
        </div>
      </div>
    </div>
  )
}
