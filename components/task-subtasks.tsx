"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Check, AlertCircle, Clock, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Subtask {
  id: string
  task_id: string
  title: string
  status: "pending" | "in_progress" | "done"
  assignee_id?: string
  assignee?: { id: string; full_name: string; email: string }
  due_date?: string
  completed_at?: string
  created_at: string
}

interface SubtasksProps {
  taskId: string
  mainTaskStatus: string
  onStatusBlocked?: (blocked: boolean) => void
}

export function TaskSubtasks({ taskId, mainTaskStatus, onStatusBlocked }: SubtasksProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [selectedAssignee, setSelectedAssignee] = useState<string>("")
  const [selectedDueDate, setSelectedDueDate] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; full_name: string; email: string }>>([])

  // Fetch subtasks and team members
  useEffect(() => {
    const loadSubtasks = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("sessionToken")
        const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          console.log("[v0] Subtasks loaded:", data)
          setSubtasks(Array.isArray(data) ? data : [])
          
          // Check if any subtask is not done - block "in_review" status
          const hasIncompleteSubtasks = data.some((s: Subtask) => s.status !== "done")
          onStatusBlocked?.(hasIncompleteSubtasks)
        } else {
          // Table might not exist yet or other error
          console.warn("[v0] Subtasks API returned:", response.status)
          setSubtasks([])
          onStatusBlocked?.(false)
        }
      } catch (error) {
        console.error("[v0] Error loading subtasks:", error)
        setSubtasks([])
        onStatusBlocked?.(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Fetch team members for assignment dropdown
    const loadTeamMembers = async () => {
      try {
        const token = localStorage.getItem("sessionToken")
        const response = await fetch("/api/team-members", {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          console.log("[v0] Team members loaded:", data)
          setTeamMembers(data.users || [])
        }
      } catch (error) {
        console.error("[v0] Error loading team members:", error)
        setTeamMembers([])
      }
    }

    loadSubtasks()
    loadTeamMembers()
  }, [taskId, onStatusBlocked])

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem("sessionToken")
      const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newSubtaskTitle.trim(),
          assignee_id: selectedAssignee || null,
          due_date: selectedDueDate || null
        })
      })

      if (response.ok) {
        const newSubtask = await response.json()
        const updatedSubtasks = [...subtasks, newSubtask]
        setSubtasks(updatedSubtasks)
        setNewSubtaskTitle("")
        setSelectedAssignee("")
        setSelectedDueDate("")
        setShowAddForm(false)
        
        // New subtask is always pending, so status is blocked
        onStatusBlocked?.(true)
      }
    } catch (error) {
      console.error("[v0] Error adding subtask:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (subtaskId: string, currentStatus: string) => {
    // Cycle through states: pending → in_progress → done → pending
    const statusCycle = {
      "pending": "in_progress",
      "in_progress": "done",
      "done": "pending"
    }
    const newStatus = statusCycle[currentStatus as keyof typeof statusCycle] || "pending"

    try {
      const token = localStorage.getItem("sessionToken")
      const response = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        const updated = await response.json()
        const updatedSubtasks = subtasks.map(s => s.id === subtaskId ? updated : s)
        setSubtasks(updatedSubtasks)
        
        // Notify parent about completion status change
        const hasIncomplete = updatedSubtasks.some(s => s.status !== "done")
        onStatusBlocked?.(hasIncomplete)
      }
    } catch (error) {
      console.error("[v0] Error updating subtask:", error)
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!confirm("Delete this subtask?")) return

    try {
      const token = localStorage.getItem("sessionToken")
      const response = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (response.ok) {
        const updatedSubtasks = subtasks.filter(s => s.id !== subtaskId)
        setSubtasks(updatedSubtasks)
        
        // Notify parent about completion status change
        const hasIncomplete = updatedSubtasks.some(s => s.status !== "done")
        onStatusBlocked?.(hasIncomplete)
      }
    } catch (error) {
      console.error("[v0] Error deleting subtask:", error)
    }
  }

  const completedCount = subtasks.filter(s => s.status === "done").length
  const progressPercent = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0
  const hasIncompleteSubtasks = subtasks.some(s => s.status !== "done")

  return (
    <div className="space-y-3">
      {/* Compact Collapsible Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 flex-1 text-left hover:opacity-75 transition-opacity group"
        >
          <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform group-hover:text-gray-700", !showDetails && "-rotate-90")} />
          <h3 className="text-sm font-semibold text-gray-900">Subtasks</h3>
          <span className="text-xs text-gray-500">({completedCount}/{subtasks.length})</span>
        </button>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Minimal Progress Bar - Always Visible */}
      <div className="space-y-1">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              Math.round(progressPercent) === 100 ? "bg-green-500" : "bg-blue-500"
            )}
            style={{ width: `${Math.round(progressPercent)}%` }}
          />
        </div>
        <p className="text-xs text-gray-600">{Math.round(progressPercent)}% complete</p>
      </div>

      {/* Warning if incomplete during review */}
      {hasIncompleteSubtasks && mainTaskStatus === "in_review" && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">Complete all subtasks before Review</p>
        </div>
      )}

      {/* Add Subtask Form */}
      {showAddForm && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-lg space-y-3">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900">Add New Subtask</h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            placeholder="Subtask title..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddSubtask()
              if (e.key === "Escape") setShowAddForm(false)
            }}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Due Date</label>
              <input
                type="date"
                value={selectedDueDate}
                onChange={(e) => setSelectedDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Assign To</label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unassigned</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.full_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleAddSubtask}
              disabled={!newSubtaskTitle.trim() || isSubmitting}
              className="flex-1 px-3 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Creating..." : "Create Subtask"}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-3 py-2 text-sm font-semibold bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Subtasks Details */}
      {showDetails && (
        <div className="border-t border-gray-200 pt-3 space-y-2">
      {isLoading ? (
        <p className="text-xs text-gray-500 text-center py-4">Loading subtasks...</p>
      ) : subtasks.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4">No subtasks yet</p>
      ) : (
        <div className="space-y-2">
          {subtasks.map(subtask => {
            // Helper to get status color
            const statusColor = subtask.status === "done" ? "bg-green-100 border-green-300" : 
                               subtask.status === "in_progress" ? "bg-blue-100 border-blue-300" : 
                               "bg-white border-gray-200"
            
            const stripeColor = subtask.status === "done" ? "bg-green-500" :
                               subtask.status === "in_progress" ? "bg-blue-500" :
                               "bg-gray-400"
            
            // Check if due date is overdue
            const isOverdue = subtask.due_date && new Date(subtask.due_date) < new Date() && subtask.status !== "done"
            
            return (
              <div
                key={subtask.id}
                className={cn(
                  "border-l-4 border rounded-r-lg p-3 transition-all hover:shadow-md",
                  statusColor,
                  "group"
                )}
                style={{ borderLeftColor: stripeColor.split("-")[1].includes("500") ? stripeColor : undefined }}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Checkbox + Title */}
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {/* Status Checkbox */}
                    <button
                      onClick={() => handleToggleStatus(subtask.id, subtask.status)}
                      className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all hover:scale-110 mt-0.5"
                      style={{
                        borderColor: subtask.status === "done" ? "#10b981" : 
                                    subtask.status === "in_progress" ? "#3b82f6" :
                                    "#d1d5db",
                        backgroundColor: subtask.status === "done" ? "#10b981" : 
                                        subtask.status === "in_progress" ? "#3b82f6" :
                                        "transparent"
                      }}
                      title="Click to cycle status: To Do → In Progress → Done"
                    >
                      {subtask.status === "done" && <Check className="w-3 h-3 text-white" />}
                      {subtask.status === "in_progress" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </button>

                    {/* Title and Metadata */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium leading-tight",
                        subtask.status === "done" ? "text-gray-400 line-through" : "text-gray-900"
                      )}>
                        {subtask.title}
                      </p>
                      
                      {/* Assignee + Due Date Row */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {/* Assignee */}
                        {subtask.assignee ? (
                          <div className="flex items-center gap-1 bg-white rounded px-2 py-1 text-xs">
                            <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">
                              {subtask.assignee.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-gray-700">{subtask.assignee.full_name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 italic">Unassigned</span>
                        )}

                        {/* Due Date */}
                        {subtask.due_date && (
                          <span className={cn(
                            "text-xs flex items-center gap-1 px-2 py-1 rounded",
                            isOverdue ? "bg-red-100 text-red-700 font-semibold" : "text-gray-600"
                          )}>
                            <Clock className="w-3 h-3" />
                            {new Date(subtask.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-all"
                    title="Delete subtask"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      )}
    </div>
  )
}
