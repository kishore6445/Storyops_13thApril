"use client"

import { Calendar, ChevronRight, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Sprint {
  id: string
  name: string
  start_date: string
  end_date: string
  status: "planning" | "active" | "completed" | "archived"
}

interface SprintListProps {
  sprints: Sprint[]
  selectedSprintId?: string
  onSprintSelect: (sprintId: string) => void
  onCreateSprint: () => void
}

export function SprintList({
  sprints,
  selectedSprintId,
  onSprintSelect,
  onCreateSprint,
}: SprintListProps) {
  // Group sprints by status
  const groupedSprints = {
    active: sprints.filter((s) => s.status === "active"),
    planning: sprints.filter((s) => s.status === "planning"),
    completed: sprints.filter((s) => s.status === "completed"),
    archived: sprints.filter((s) => s.status === "archived"),
  }

  const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    active: { label: "Active", color: "text-[#34C759]", bgColor: "bg-[#34C759]/10" },
    planning: { label: "Planning", color: "text-[#007AFF]", bgColor: "bg-[#007AFF]/10" },
    completed: { label: "Completed", color: "text-[#86868B]", bgColor: "bg-[#86868B]/10" },
    archived: { label: "Archived", color: "text-[#D1D1D6]", bgColor: "bg-[#D1D1D6]/10" },
  }

  const renderSprintGroup = (status: string, items: Sprint[]) => {
    if (items.length === 0) return null

    const config = statusConfig[status]

    return (
      <div key={status} className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className={cn("w-2 h-2 rounded-full", config.color.replace("text-", "bg-"))} />
          <h3 className="text-sm font-bold text-[#1D1D1F] uppercase tracking-wide">
            {config.label}
          </h3>
          <span className="text-xs text-[#86868B] font-semibold">{items.length}</span>
        </div>

        <div className="space-y-2">
          {items.map((sprint) => (
            <button
              key={sprint.id}
              onClick={() => onSprintSelect(sprint.id)}
              className={cn(
                "w-full text-left flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                selectedSprintId === sprint.id
                  ? "border-[#007AFF] bg-[#007AFF]/5"
                  : "border-[#E5E5E7] hover:border-[#D1D1D6] bg-white"
              )}
            >
              {/* Left accent stripe by status */}
              <div
                className={cn(
                  "w-1 h-12 rounded-full flex-shrink-0",
                  status === "active"
                    ? "bg-[#34C759]"
                    : status === "planning"
                      ? "bg-[#007AFF]"
                      : status === "completed"
                        ? "bg-[#86868B]"
                        : "bg-[#D1D1D6]"
                )}
              />

              {/* Sprint info */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-semibold text-sm",
                    selectedSprintId === sprint.id ? "text-[#007AFF]" : "text-[#1D1D1F]"
                  )}
                >
                  {sprint.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-[#86868B] flex-shrink-0" />
                  <p className="text-xs text-[#86868B]">
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
              </div>

              {/* Chevron */}
              <ChevronRight
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-all",
                  selectedSprintId === sprint.id ? "text-[#007AFF]" : "text-[#86868B]"
                )}
              />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-6 flex-1 overflow-y-auto">
      {/* Create Sprint Button */}
      <button
        onClick={onCreateSprint}
        className="w-full mb-8 flex items-center justify-center gap-2 py-3 bg-[#007AFF] text-white font-semibold text-sm rounded-xl hover:opacity-90 transition-all"
      >
        <Plus className="w-4 h-4" />
        Create New Sprint
      </button>

      {/* Sprint Groups */}
      {groupedSprints.active.length > 0 ||
      groupedSprints.planning.length > 0 ||
      groupedSprints.completed.length > 0 ? (
        <>
          {renderSprintGroup("active", groupedSprints.active)}
          {renderSprintGroup("planning", groupedSprints.planning)}
          {renderSprintGroup("completed", groupedSprints.completed)}
          {renderSprintGroup("archived", groupedSprints.archived)}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-[#E5E5E7] rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-[#86868B]" />
          </div>
          <p className="text-sm font-semibold text-[#1D1D1F]">No sprints yet</p>
          <p className="text-xs text-[#86868B] mt-1 mb-4">Create your first sprint to get started</p>
          <button
            onClick={onCreateSprint}
            className="px-4 py-2 bg-[#007AFF] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Sprint
          </button>
        </div>
      )}
    </div>
  )
}
