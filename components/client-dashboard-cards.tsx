import { CheckCircle2, Calendar, FileText, BarChart3 } from "lucide-react"

interface ClientDashboardCardsProps {
  totalTasks: number
  completedTasks: number
  completionRate: number
  meetingCount: number
  publishedContent: number
  scheduledContent: number
}

export function ClientDashboardCards({
  totalTasks,
  completedTasks,
  completionRate,
  meetingCount,
  publishedContent,
  scheduledContent,
}: ClientDashboardCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Tasks Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Tasks</h3>
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-3xl font-bold text-slate-900">{completedTasks}</p>
          <p className="text-sm text-slate-600">of {totalTasks}</p>
        </div>
        <p className="text-xs text-slate-500">Completed</p>
      </div>

      {/* Completion Rate Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Progress</h3>
          <div className="p-2 bg-green-100 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-3xl font-bold text-slate-900">{completionRate}%</p>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Meetings Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Meetings</h3>
          <div className="p-2 bg-purple-100 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-3xl font-bold text-slate-900">{meetingCount}</p>
        </div>
        <p className="text-xs text-slate-500">Total meetings</p>
      </div>

      {/* Published Content Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Published</h3>
          <div className="p-2 bg-emerald-100 rounded-lg">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-3xl font-bold text-slate-900">{publishedContent}</p>
        </div>
        <p className="text-xs text-slate-500">Published posts</p>
      </div>

      {/* Scheduled Content Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Scheduled</h3>
          <div className="p-2 bg-amber-100 rounded-lg">
            <Calendar className="w-5 h-5 text-amber-600" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <p className="text-3xl font-bold text-slate-900">{scheduledContent}</p>
        </div>
        <p className="text-xs text-slate-500">Scheduled posts</p>
      </div>
    </div>
  )
}
