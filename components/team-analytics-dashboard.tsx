"use client"

import { useState } from "react"
import { Search, AlertCircle, CheckCircle2, Clock, User, Archive, Copy } from "lucide-react"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { TaskModalWithPKR } from "@/components/task-modal-with-pkr"
import { ArchiveConfirmModal } from "@/components/archive-confirm-modal"

interface Task {
  id: string
  task_id?: string
  title: string
  status: "todo" | "in_progress" | "in_review" | "done"
  due_date?: string
  assigned_to?: string
}

interface TeamMember {
  id: string
  full_name: string
  email: string
  tasksAssigned?: Task[]
  taskStats?: {
    total: number
    completed: number
    overdue?: number
  }
}

const fetcher = (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then((res) => res.json())
}

export function TeamAnalyticsDashboard() {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "overdue" | "due-soon" | "completed">("all")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [taskToArchive, setTaskToArchive] = useState<Task | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const { toast } = useToast()
  const { data: analyticsData } = useSWR("/api/team/analytics", fetcher)
  const teamMembers: TeamMember[] = analyticsData?.teamMembers || []

  // Copy tasks from a section to clipboard
  const handleCopyTasks = (tasks: Task[], sectionName: string) => {
    if (tasks.length === 0) return
    const taskIds = tasks.map(t => t.task_id || t.id).join("\n")
    navigator.clipboard.writeText(taskIds)
    setCopiedSection(sectionName)
    toast({
      title: "Copied!",
      description: `${tasks.length} task ID${tasks.length > 1 ? "s" : ""} copied to clipboard`,
    })
    setTimeout(() => setCopiedSection(null), 2000)
  }

  // Get today's date for comparisons
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Handle archive action
  const handleArchiveTask = async () => {
    if (!dueDate) return "no-date"
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    
    const daysUntilDue = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDue < 0) return "overdue"
    if (daysUntilDue === 0) return "due-today"
    if (daysUntilDue <= 3) return "due-soon"
    return "on-track"
  }

  // Handle archive action
  const handleArchiveTask = async () => {
    if (!taskToArchive) return
    setIsArchiving(true)
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null
      const response = await fetch("/api/tasks/archive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ taskId: taskToArchive.id, action: "archive" }),
      })
      if (response.ok) {
        toast({
          title: "Task archived",
          description: `"${taskToArchive.title}" has been archived successfully.`,
        })
        setShowArchiveModal(false)
        setTaskToArchive(null)
      } else {
        toast({
          title: "Archive failed",
          description: "Failed to archive the task. Please try again.",
          variant: "destructive",
        })
        console.error("[v0] Archive failed with status:", response.status)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while archiving the task.",
        variant: "destructive",
      })
      console.error("[v0] Error archiving task:", error)
    } finally {
      setIsArchiving(false)
    }
  }

  // Filter members by search
  const filteredMembers = teamMembers.filter(m =>
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get selected member
  const selectedMember = filteredMembers.find(m => m.id === selectedMemberId)

  // Filter tasks
  let displayedTasks = selectedMember?.tasksAssigned || []
  
  displayedTasks = displayedTasks.filter(task => {
    if (statusFilter === "overdue") {
      return getTaskStatus(task.due_date) === "overdue"
    }
    if (statusFilter === "due-soon") {
      return ["due-today", "due-soon"].includes(getTaskStatus(task.due_date))
    }
    if (statusFilter === "completed") {
      return task.status === "done"
    }
    return true
  })

  // Group pending tasks by status
  const pendingTasks = displayedTasks.filter(t => t.status !== "done")
  const completedTasks = displayedTasks.filter(t => t.status === "done")

  const overdueTasks = pendingTasks.filter(t => getTaskStatus(t.due_date) === "overdue")
  const dueSoonTasks = pendingTasks.filter(t => ["due-today", "due-soon"].includes(getTaskStatus(t.due_date)))
  const onTrackTasks = pendingTasks.filter(t => getTaskStatus(t.due_date) === "on-track" || getTaskStatus(t.due_date) === "no-date")

  const TaskRow = ({ task }: { task: Task }) => {
    const taskStatus = getTaskStatus(task.due_date)
    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No date"
    
    return (
      <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors hover:shadow-sm group">
        {/* Status indicator */}
        <div className="flex-shrink-0">
          {task.status === "done" ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : taskStatus === "overdue" ? (
            <AlertCircle className="w-5 h-5 text-red-600" />
          ) : taskStatus === "due-today" || taskStatus === "due-soon" ? (
            <Clock className="w-5 h-5 text-amber-600" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
          )}
        </div>

        {/* Task info - clickable */}
        <button
          onClick={() => {
            setSelectedTask(task)
            setShowTaskModal(true)
          }}
          className="flex-1 min-w-0 text-left hover:opacity-75 transition-opacity"
        >
          <p className="font-medium text-gray-900 truncate text-sm">{task.title}</p>
          <p className="text-xs text-gray-500">{task.task_id || task.id}</p>
        </button>

        {/* Due date with status badge */}
        <div className="flex-shrink-0 text-right">
          <p className={cn("text-sm font-medium", 
            taskStatus === "overdue" && "text-red-600",
            taskStatus === "due-today" && "text-red-600",
            taskStatus === "due-soon" && "text-amber-600",
            taskStatus === "on-track" && "text-gray-600",
            taskStatus === "no-date" && "text-gray-400"
          )}>
            {dueDate}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {taskStatus === "overdue" && "Overdue"}
            {taskStatus === "due-today" && "Due today"}
            {taskStatus === "due-soon" && "Due soon"}
            {taskStatus === "on-track" && "On track"}
            {taskStatus === "no-date" && "No date"}
          </p>
        </div>

        {/* Archive button - shown on completed tasks */}
        {task.status === "done" && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setTaskToArchive(task)
              setShowArchiveModal(true)
            }}
            className="flex-shrink-0 p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
            title="Archive task"
          >
            <Archive className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white h-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Left: Team Member List */}
        <div className="lg:col-span-1 border-r border-gray-200 p-6 overflow-y-auto bg-gray-50">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Team</h2>
            <p className="text-sm text-gray-600">Select a member to view their tasks</p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedMemberId(null)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Member List */}
          <div className="space-y-2">
            {filteredMembers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No team members found</p>
            ) : (
              filteredMembers.map((member) => {
                const memberOverdue = (member.tasksAssigned || []).filter(
                  t => t.status !== "done" && getTaskStatus(t.due_date) === "overdue"
                ).length
                const memberTotal = (member.tasksAssigned || []).filter(t => t.status !== "done").length

                return (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMemberId(member.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-colors border",
                      selectedMemberId === member.id
                        ? "bg-white border-blue-500 shadow-sm"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{member.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                      </div>
                      {memberOverdue > 0 && (
                        <div className="flex-shrink-0 px-2 py-1 bg-red-100 rounded text-xs font-medium text-red-700">
                          {memberOverdue}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2 text-xs text-gray-500">
                      <span>{memberTotal} pending</span>
                      {memberOverdue > 0 && <span className="text-red-600">• {memberOverdue} overdue</span>}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right: Tasks View */}
        <div className="lg:col-span-2 p-6 overflow-y-auto">
          {selectedMember ? (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedMember.full_name}</h3>
                    <p className="text-sm text-gray-600">{selectedMember.email}</p>
                  </div>
                </div>
              </div>

              {/* Task Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs text-red-600 font-medium mb-1">Overdue</p>
                  <p className="text-3xl font-bold text-red-700">{overdueTasks.length}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-600 font-medium mb-1">Due Soon</p>
                  <p className="text-3xl font-bold text-amber-700">{dueSoonTasks.length}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-medium mb-1">Completed</p>
                  <p className="text-3xl font-bold text-green-700">{completedTasks.length}</p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                {[
                  { value: "all", label: "All Tasks" },
                  { value: "overdue", label: "Overdue", count: overdueTasks.length },
                  { value: "due-soon", label: "Due Soon", count: dueSoonTasks.length },
                  { value: "completed", label: "Completed", count: completedTasks.length },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value as any)}
                    className={cn(
                      "px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px",
                      statusFilter === tab.value
                        ? "text-blue-600 border-blue-600"
                        : "text-gray-600 border-transparent hover:text-gray-900"
                    )}
                  >
                    {tab.label} {tab.count !== undefined && `(${tab.count})`}
                  </button>
                ))}
              </div>

              {/* Task List */}
              <div className="space-y-2">
                {displayedTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No tasks to show</p>
                  </div>
                ) : (
                  <>
                    {/* Overdue section */}
                    {overdueTasks.length > 0 && (statusFilter === "all" || statusFilter === "overdue") && (
                      <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <h4 className="font-semibold text-red-600 text-sm">Overdue ({overdueTasks.length})</h4>
                          </div>
                          <button
                            onClick={() => handleCopyTasks(overdueTasks, "overdue")}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
                              copiedSection === "overdue"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
                            )}
                            title="Copy all overdue task IDs"
                          >
                            <Copy className="w-3 h-3" />
                            {copiedSection === "overdue" ? "Copied!" : "Copy All"}
                          </button>
                        </div>
                        <div className="space-y-2 mb-6">
                          {overdueTasks.map(task => <TaskRow key={task.id} task={task} />)}
                        </div>
                      </div>
                    )}

                    {/* Due Soon section */}
                    {dueSoonTasks.length > 0 && (statusFilter === "all" || statusFilter === "due-soon") && (
                      <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <h4 className="font-semibold text-amber-600 text-sm">Due Soon ({dueSoonTasks.length})</h4>
                          </div>
                          <button
                            onClick={() => handleCopyTasks(dueSoonTasks, "due-soon")}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
                              copiedSection === "due-soon"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-600"
                            )}
                            title="Copy all due soon task IDs"
                          >
                            <Copy className="w-3 h-3" />
                            {copiedSection === "due-soon" ? "Copied!" : "Copy All"}
                          </button>
                        </div>
                        <div className="space-y-2 mb-6">
                          {dueSoonTasks.map(task => <TaskRow key={task.id} task={task} />)}
                        </div>
                      </div>
                    )}

                    {/* On Track section */}
                    {onTrackTasks.length > 0 && (statusFilter === "all") && (
                      <div>
                        <div className="flex items-center gap-2 mb-3 px-1">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-400" />
                          <h4 className="font-semibold text-gray-600 text-sm">On Track ({onTrackTasks.length})</h4>
                        </div>
                        <div className="space-y-2 mb-6">
                          {onTrackTasks.map(task => <TaskRow key={task.id} task={task} />)}
                        </div>
                      </div>
                    )}

                    {/* Completed section */}
                    {completedTasks.length > 0 && (statusFilter === "all" || statusFilter === "completed") && (
                      <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <h4 className="font-semibold text-green-600 text-sm">Completed ({completedTasks.length})</h4>
                          </div>
                          <button
                            onClick={() => handleCopyTasks(completedTasks, "completed")}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
                              copiedSection === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600"
                            )}
                            title="Copy all completed task IDs"
                          >
                            <Copy className="w-3 h-3" />
                            {copiedSection === "completed" ? "Copied!" : "Copy All"}
                          </button>
                        </div>
                        <div className="space-y-2">
                          {completedTasks.map(task => <TaskRow key={task.id} task={task} />)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Select a team member to view their tasks</p>
                <p className="text-gray-400 text-sm mt-2">See overdue items, due dates, and completion status at a glance</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Edit Modal */}
      {selectedTask && (
        <TaskModalWithPKR
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false)
            setSelectedTask(null)
          }}
          onSave={async (taskData) => {
            try {
              const response = await fetch(`/api/tasks/${selectedTask.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(taskData),
              })
              if (response.ok) {
                setShowTaskModal(false)
                setSelectedTask(null)
              }
            } catch (error) {
              console.error("[v0] Error saving task:", error)
            }
          }}
          task={selectedTask}
        />
      )}

      {/* Archive Confirmation Modal */}
      {taskToArchive && (
        <ArchiveConfirmModal
          isOpen={showArchiveModal}
          taskTitle={taskToArchive.title}
          isLoading={isArchiving}
          onConfirm={handleArchiveTask}
          onCancel={() => {
            setShowArchiveModal(false)
            setTaskToArchive(null)
          }}
        />
      )}
    </div>
  )
}
