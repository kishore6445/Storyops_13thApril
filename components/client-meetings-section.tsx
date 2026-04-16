import { Calendar, FileText, Video, Download } from "lucide-react"

interface Meeting {
  id: string
  title: string
  date?: string
  time?: string
  notes?: string
  recording_url?: string
}

interface ClientMeetingsSectionProps {
  meetings: Meeting[]
}

export function ClientMeetingsSection({ meetings }: ClientMeetingsSectionProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date not set"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  if (meetings.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-slate-100 rounded-lg">
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Meeting #{i}</p>
                <p className="text-xs text-slate-500">Coming soon</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Meeting Notes</p>
                <div className="h-12 bg-slate-50 rounded border border-slate-200" />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Recording</p>
                <div className="h-10 bg-slate-50 rounded border border-slate-200 flex items-center justify-center">
                  <p className="text-xs text-slate-400">Recording placeholder</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {meetings.map((meeting) => (
        <div key={meeting.id} className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{meeting.title}</p>
              <p className="text-xs text-slate-500">{formatDate(meeting.date)}</p>
            </div>
          </div>

          {/* Meeting Notes */}
          {meeting.notes ? (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <p className="text-sm font-medium text-slate-900">Meeting Notes</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <p className="text-sm text-slate-700 line-clamp-3">{meeting.notes}</p>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <p className="text-sm font-medium text-slate-600">Meeting Notes</p>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 border-dashed">
                <p className="text-xs text-slate-400">Notes placeholder</p>
              </div>
            </div>
          )}

          {/* Recording */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Video className="w-4 h-4 text-slate-600" />
              <p className="text-sm font-medium text-slate-900">Recording</p>
            </div>
            {meeting.recording_url ? (
              <a
                href={meeting.recording_url}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Download Recording
              </a>
            ) : (
              <div className="p-3 bg-slate-50 rounded border border-slate-200 border-dashed">
                <p className="text-xs text-slate-400">Recording placeholder - Coming soon</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
