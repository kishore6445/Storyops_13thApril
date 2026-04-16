import { CheckCircle2, Circle, AlertCircle } from "lucide-react"

interface Task {
  id: string
  task_id?: string
  title: string
  status: "todo" | "in_progress" | "in_review" | "done"
  due_date?: string
  assigned_to?: string
  assigned_user_name?: string
}

interface ClientTasksTableProps {
  tasks: Task[]
}

export function ClientTasksTable({ tasks }: ClientTasksTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-800"
      case "in_review":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "todo":
        return "bg-slate-100 text-slate-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="w-4 h-4" />
      case "in_progress":
        return <Circle className="w-4 h-4" />
      case "in_review":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Circle className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "done":
        return "Completed"
      case "in_review":
        return "In Review"
      case "in_progress":
        return "In Progress"
      case "todo":
        return "To Do"
      default:
        return status
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const isOverdue = (dateString?: string, status?: string) => {
    if (!dateString || status === "done") return false
    const due = new Date(dateString)
    return due < new Date()
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <Circle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600">No tasks assigned yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Task</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Assigned To</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Status</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600">Due Date</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div>
                  <p className="font-medium text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{task.task_id || task.id}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-slate-700">{task.assigned_user_name || "Unassigned"}</p>
              </td>
              <td className="px-6 py-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {getStatusIcon(task.status)}
                  {getStatusLabel(task.status)}
                </div>
              </td>
              <td className="px-6 py-4">
                <div>
                  <p className={`text-sm ${isOverdue(task.due_date, task.status) ? "text-red-600 font-semibold" : "text-slate-700"}`}>
                    {formatDate(task.due_date)}
                  </p>
                  {isOverdue(task.due_date, task.status) && (
                    <p className="text-xs text-red-600 mt-1">Overdue</p>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
