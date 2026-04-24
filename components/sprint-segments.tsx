'use client'

import { useState } from 'react'
import { ChevronDown, Calendar, CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Sprint {
  id: string
  name: string
  start_date: string
  end_date: string
  status: 'planning' | 'active' | 'completed'
}

interface Task {
  id: string
  title: string
  dueDate: string
  assignedTo: string
  phase: string
  priority: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'in_review' | 'done'
  sprintId?: string
}

interface SprintSegmentsProps {
  sprints: Sprint[]
  tasks: Task[]
  backlogTasks: Task[]
  onAddTask?: () => void
  onCloseSprint?: (sprint: Sprint) => void
  isLoading?: boolean
}

function formatDate(dateStr: string) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function SprintStatusBadge({ status }: { status: Sprint["status"] }) {
  const config = {
    active: { label: "Active", class: "bg-[#007AFF]/10 text-[#007AFF]" },
    planning: { label: "Planning", class: "bg-[#FF9500]/10 text-[#FF9500]" },
    completed: { label: "Completed", class: "bg-[#34C759]/10 text-[#34C759]" },
  }
  const { label, class: cls } = config[status]
  return (
    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", cls)}>
      {label}
    </span>
  )
}

export function SprintSegments({
  sprints,
  tasks,
  backlogTasks,
  onAddTask,
  onCloseSprint,
  isLoading = false,
}: SprintSegmentsProps) {
  const [showCompleted, setShowCompleted] = useState(false)

  const activeSprints = sprints.filter((s) => s.status === 'active')
  const planningSprints = sprints.filter((s) => s.status === 'planning')
  const completedSprints = sprints.filter((s) => s.status === 'completed')

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-[#F5F5F7] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (sprints.length === 0) {
    return (
      <div className="text-center py-12 bg-[#F5F5F7] rounded-xl">
        <Clock className="w-8 h-8 text-[#D1D1D6] mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#1D1D1F]">No sprints yet</p>
        <p className="text-xs text-[#86868B] mt-1">Create your first sprint below to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Active Sprints ── */}
      {activeSprints.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#007AFF]" />
            <h3 className="text-sm font-bold text-[#1D1D1F]">Active</h3>
            <span className="text-xs text-[#86868B]">({activeSprints.length})</span>
          </div>
          <div className="space-y-3">
            {activeSprints.map((sprint) => {
              const sprintTasks = tasks.filter(t => t.sprintId === sprint.id)
              const done = sprintTasks.filter(t => t.status === 'done').length
              const pct = sprintTasks.length > 0 ? Math.round((done / sprintTasks.length) * 100) : 0

              return (
                <div
                  key={sprint.id}
                  className="bg-white border border-[#E5E5E7] rounded-xl p-5 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <SprintStatusBadge status="active" />
                      </div>
                      <h4 className="font-bold text-[#1D1D1F] text-base mt-1">{sprint.name}</h4>
                      {(sprint.start_date || sprint.end_date) && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#86868B]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {sprint.start_date ? formatDate(sprint.start_date) : "—"}
                            {" → "}
                            {sprint.end_date ? formatDate(sprint.end_date) : "—"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Close Sprint — prominent */}
                    {onCloseSprint && (
                      <button
                        onClick={() => onCloseSprint(sprint)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E5E7] text-xs font-semibold text-[#86868B] hover:border-[#FF3B30] hover:text-[#FF3B30] hover:bg-[#FF3B30]/5 transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Close Sprint
                      </button>
                    )}
                  </div>

                  {/* Stats cards */}
                  {(() => {
                    const todo = sprintTasks.filter(t => t.status === 'todo' || t.status === 'to-do' || t.status === 'to_do').length
                    const inProgress = sprintTasks.filter(t => t.status === 'in_progress' || t.status === 'in-progress').length
                    const inReview = sprintTasks.filter(t => t.status === 'in_review' || t.status === 'in-review').length
                    const remaining = sprintTasks.filter(t => t.status !== 'done').length
                    const atRisk = sprintTasks.filter(t => t.status === 'blocked').length
                    return (
                      <div className="mt-4 space-y-3">
                        {/* Progress bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-[#86868B]">
                            <span>{done} of {sprintTasks.length} tasks done</span>
                            <span className="font-semibold text-[#1D1D1F]">{pct}%</span>
                          </div>
                          <div className="w-full bg-[#F0F0F0] rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                pct === 100 ? "bg-[#34C759]" : "bg-[#007AFF]"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        {/* Stat pills row */}
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-[#F5F5F7] rounded-lg px-3 py-2 text-center">
                            <p className="text-[10px] font-semibold text-[#86868B] uppercase tracking-wide">To Do</p>
                            <p className="text-lg font-bold text-[#1D1D1F] leading-tight">{todo}</p>
                          </div>
                          <div className="bg-[#007AFF]/8 rounded-lg px-3 py-2 text-center">
                            <p className="text-[10px] font-semibold text-[#007AFF] uppercase tracking-wide">In Progress</p>
                            <p className="text-lg font-bold text-[#007AFF] leading-tight">{inProgress}</p>
                          </div>
                          <div className="bg-[#FF9500]/8 rounded-lg px-3 py-2 text-center">
                            <p className="text-[10px] font-semibold text-[#FF9500] uppercase tracking-wide">In Review</p>
                            <p className="text-lg font-bold text-[#FF9500] leading-tight">{inReview}</p>
                          </div>
                          <div className="bg-[#34C759]/8 rounded-lg px-3 py-2 text-center">
                            <p className="text-[10px] font-semibold text-[#34C759] uppercase tracking-wide">Done</p>
                            <p className="text-lg font-bold text-[#34C759] leading-tight">{done}</p>
                          </div>
                        </div>
                        {/* Secondary stats */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-[#86868B]">
                            <Clock className="w-3.5 h-3.5" />
                            <span><span className="font-semibold text-[#1D1D1F]">{remaining}</span> remaining</span>
                          </div>
                          {atRisk > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-[#FF3B30]">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span><span className="font-semibold">{atRisk}</span> blocked</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-[#86868B]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span><span className="font-semibold text-[#1D1D1F]">{pct}%</span> complete</span>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Planning Sprints ── */}
      {planningSprints.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-[#FF9500]" />
            <h3 className="text-sm font-bold text-[#1D1D1F]">Upcoming</h3>
            <span className="text-xs text-[#86868B]">({planningSprints.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {planningSprints.map((sprint) => {
              const sprintTasks = tasks.filter(t => t.sprintId === sprint.id)
              const done = sprintTasks.filter(t => t.status === 'done').length
              const todo = sprintTasks.filter(t => t.status === 'todo' || t.status === 'to-do' || t.status === 'to_do').length
              const inProgress = sprintTasks.filter(t => t.status === 'in_progress' || t.status === 'in-progress').length
              return (
              <div
                key={sprint.id}
                className="bg-white border border-[#E5E5E7] rounded-xl p-4 hover:shadow-sm transition-all"
              >
                <SprintStatusBadge status="planning" />
                <h4 className="font-bold text-[#1D1D1F] mt-2 text-sm">{sprint.name}</h4>
                {sprint.start_date && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#86868B]">
                    <Calendar className="w-3 h-3" />
                    <span>Starts {formatDate(sprint.start_date)}</span>
                  </div>
                )}
                {sprintTasks.length > 0 && (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#F0F0F0]">
                    <span className="text-xs text-[#86868B]"><span className="font-semibold text-[#1D1D1F]">{sprintTasks.length}</span> tasks</span>
                    <span className="text-xs text-[#86868B]"><span className="font-semibold text-[#007AFF]">{todo}</span> to-do</span>
                    <span className="text-xs text-[#86868B]"><span className="font-semibold text-[#007AFF]">{inProgress}</span> in progress</span>
                    <span className="text-xs text-[#86868B]"><span className="font-semibold text-[#34C759]">{done}</span> done</span>
                  </div>
                )}
              </div>
            )})
          </div>
        </section>
      )}

      {/* ── Completed Sprints — Collapsible ── */}
      {completedSprints.length > 0 && (
        <section>
          <button
            onClick={() => setShowCompleted(v => !v)}
            className="flex items-center gap-2 w-full text-left group mb-3"
          >
            <CheckCircle2 className="w-4 h-4 text-[#34C759]" />
            <h3 className="text-sm font-bold text-[#1D1D1F]">Completed</h3>
            <span className="text-xs text-[#86868B]">({completedSprints.length})</span>
            <ChevronDown className={cn(
              "w-4 h-4 text-[#86868B] ml-auto transition-transform",
              showCompleted && "rotate-180"
            )} />
          </button>

          {showCompleted && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {completedSprints.map((sprint) => (
                <div
                  key={sprint.id}
                  className="bg-[#FAFAFA] border border-[#E5E5E7] rounded-xl p-4"
                >
                  <SprintStatusBadge status="completed" />
                  <h4 className="font-semibold text-[#1D1D1F] mt-2 text-sm">{sprint.name}</h4>
                  {sprint.end_date && (
                    <p className="text-xs text-[#86868B] mt-1">Closed {formatDate(sprint.end_date)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Backlog ── */}
      {backlogTasks.length > 0 && (
        <section>
          <details className="group">
            <summary className="cursor-pointer flex items-center gap-2 text-sm font-bold text-[#1D1D1F] mb-3 list-none">
              <AlertCircle className="w-4 h-4 text-[#86868B]" />
              Backlog
              <span className="text-xs font-normal text-[#86868B]">({backlogTasks.length} unscheduled)</span>
              <ChevronDown className="w-4 h-4 text-[#86868B] ml-auto group-open:rotate-180 transition-transform" />
            </summary>
            <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
              {backlogTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 bg-[#F5F5F7] rounded-lg px-3 py-2.5 text-sm"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#86868B] flex-shrink-0" />
                  <p className="text-[#1D1D1F] font-medium truncate">{task.title}</p>
                  {task.phase && (
                    <span className="ml-auto text-xs text-[#86868B] flex-shrink-0 bg-[#E5E5E7] px-2 py-0.5 rounded">
                      {task.phase}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </details>
        </section>
      )}
    </div>
  )
}
