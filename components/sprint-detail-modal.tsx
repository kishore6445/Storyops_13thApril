"use client"

import { useState } from "react"
import { X, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  status: "todo" | "in_progress" | "in_review" | "done"
  priority: "high" | "medium" | "low"
  assignedTo?: string
  dueDate?: string
}

interface Sprint {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
}

interface SprintDetailModalProps {
  isOpen: boolean
  onClose: () => void
  sprint: Sprint | null
  tasks: Task[]
  isLoading?: boolean
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  todo: { label: "To Do", color: "text-[#86868B]", bgColor: "bg-[#F5F5F7]" },
  in_progress: { label: "In Progress", color: "text-[#007AFF]", bgColor: "bg-[#007AFF]/10" },
  in_review: { label: "In Review", color: "text-[#FF9500]", bgColor: "bg-[#FF9500]/10" },
  done: { label: "Done", color: "text-[#34C759]", bgColor: "bg-[#34C759]/10" },
}

export function SprintDetailModal({
  isOpen,
  onClose,
  sprint,
  tasks,
  isLoading,
}: SprintDetailModalProps) {
  if (!isOpen || !sprint) return null

  // Group tasks by status
  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    in_review: tasks.filter((t) => t.status === "in_review"),
    done: tasks.filter((t) => t.status === "done"),
  }

  const totalTasks = tasks.length
  const completedTasks = tasksByStatus.done.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end">
      {/* Modal drawer */}
      <div className="w-full max-w-2xl bg-white rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E5E7] flex-shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1D1D1F]">{sprint.name}</h2>
            <p className="text-xs text-[#86868B] mt-1">
              {new Date(sprint.start_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              —{" "}
              {new Date(sprint.end_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F5F5F7] rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-[#86868B]" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-4 border-b border-[#E5E5E7] flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wide">Progress</p>
            <p className="text-sm font-bold text-[#1D1D1F]">
              {completedTasks} of {totalTasks} tasks ({completionRate}%)
            </p>
          </div>
          <div className="w-full h-2 bg-[#E5E5E7] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#34C759] rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Tasks in kanban columns */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-[#86868B]">Loading tasks...</p>
          </div>
        ) : totalTasks === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm font-semibold text-[#1D1D1F]">No tasks yet</p>
              <p className="text-xs text-[#86868B] mt-1">Add tasks to this sprint to get started</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto px-6 py-4">
            <div className="flex gap-4 min-w-max pb-4">
              {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
                const config = statusConfig[status as keyof typeof statusConfig]
                return (
                  <div key={status} className="w-80 flex-shrink-0">
                    <div className="mb-3 flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", config.color.replace("text-", "bg-"))} />
                      <p className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wide">
                        {config.label}
                      </p>
                      <span className="text-xs font-bold text-[#86868B]">{statusTasks.length}</span>
                    </div>

                    <div className={cn("rounded-xl p-3 min-h-[400px]", config.bgColor)}>
                      <div className="space-y-2">
                        {statusTasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-white rounded-lg p-3 border border-[#E5E5E7] hover:shadow-sm transition-all cursor-pointer group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#1D1D1F] line-clamp-2 group-hover:text-[#007AFF] transition-colors">
                                  {task.title}
                                </p>
                                {task.assignedTo && (
                                  <p className="text-xs text-[#86868B] mt-1">Assigned to {task.assignedTo}</p>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#D1D1D6] flex-shrink-0 group-hover:text-[#007AFF] transition-colors" />
                            </div>

                            {/* Priority badge */}
                            {task.priority && (
                              <div className="mt-2 flex items-center gap-1">
                                <span
                                  className={cn(
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide",
                                    task.priority === "high"
                                      ? "bg-[#FF3B30]/10 text-[#FF3B30]"
                                      : task.priority === "medium"
                                        ? "bg-[#FF9500]/10 text-[#FF9500]"
                                        : "bg-[#34C759]/10 text-[#34C759]"
                                  )}
                                >
                                  {task.priority}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
