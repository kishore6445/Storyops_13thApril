import { CheckCircle2, Clock, FileText } from "lucide-react"

interface ContentRecord {
  id: string
  title: string
  status: "draft" | "scheduled" | "published"
  platform?: string
  published_date?: string
  scheduled_date?: string
}

interface ClientContentStatusProps {
  contentRecords: ContentRecord[]
}

export function ClientContentStatus({ contentRecords }: ClientContentStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800"
      case "scheduled":
        return "bg-amber-100 text-amber-800"
      case "draft":
        return "bg-slate-100 text-slate-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle2 className="w-4 h-4" />
      case "scheduled":
        return <Clock className="w-4 h-4" />
      case "draft":
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "published":
        return "Published"
      case "scheduled":
        return "Scheduled"
      case "draft":
        return "Draft"
      default:
        return status
    }
  }

  // Group content by platform
  const groupedByPlatform = contentRecords.reduce((acc, record) => {
    const platform = record.platform || "Other"
    if (!acc[platform]) {
      acc[platform] = []
    }
    acc[platform].push(record)
    return acc
  }, {} as Record<string, ContentRecord[]>)

  // Calculate stats
  const publishedCount = contentRecords.filter(c => c.status === "published").length
  const scheduledCount = contentRecords.filter(c => c.status === "scheduled").length
  const draftCount = contentRecords.filter(c => c.status === "draft").length

  if (contentRecords.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-sm">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">No content posts yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-600 font-medium">Published</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{publishedCount}</p>
        </div>
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
          <p className="text-sm text-amber-600 font-medium">Scheduled</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{scheduledCount}</p>
        </div>
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-600 font-medium">Draft</p>
          <p className="text-2xl font-bold text-slate-700 mt-1">{draftCount}</p>
        </div>
      </div>

      {/* Content by Platform */}
      <div className="grid grid-cols-1 gap-6">
        {Object.entries(groupedByPlatform).map(([platform, records]) => (
          <div key={platform} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">{platform}</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {records.map((record) => (
                <div key={record.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{record.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{record.id}</p>
                    </div>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                      {getStatusLabel(record.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
