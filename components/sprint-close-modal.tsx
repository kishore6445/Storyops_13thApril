"use client"

import { useState } from "react"
import { X, CheckCircle2, ArrowRight, AlertCircle, Package, Sparkles, ChevronLeft, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  status: "todo" | "in-progress" | "in_progress" | "in-review" | "in_review" | "done"
}

interface Sprint {
  id: string
  name: string
}

interface SprintCloseModalProps {
  isOpen: boolean
  onClose: () => void
  sprint: Sprint | null
  tasks: Task[]
  sprints: Sprint[]
  onSprintClosed: () => void
}

type Destination = "backlog" | "new-sprint"
type Step = 1 | 2

export function SprintCloseModal({
  isOpen,
  onClose,
  sprint,
  tasks,
  sprints,
  onSprintClosed,
}: SprintCloseModalProps) {
  const [step, setStep] = useState<Step>(1)
  const [destination, setDestination] = useState<Destination>("backlog")
  const [newSprintName, setNewSprintName] = useState("")
  const [isClosing, setIsClosing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isInProgress = (s: Task["status"]) => s === "in-progress" || s === "in_progress"
  const isInReview = (s: Task["status"]) => s === "in-review" || s === "in_review"

  const doneTasks = tasks.filter((t) => t.status === "done")
  const pendingTasks = tasks.filter((t) => t.status === "todo" || isInProgress(t.status) || isInReview(t.status))
  const totalPending = pendingTasks.length

  const handleReset = () => {
    setStep(1)
    setDestination("backlog")
    setNewSprintName("")
    setError(null)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const canProceedToStep2 = () => {
    if (totalPending === 0) return true
    if (destination === "backlog") return true
    if (destination === "new-sprint") return newSprintName.trim().length > 0
    return false
  }

  const handleConfirmClose = async () => {
    if (!sprint) return

    setError(null)
    setIsClosing(true)
    try {
      const token = localStorage.getItem("sessionToken")
      const payload = {
        sprintId: sprint.id,
        destination,
        newSprintName: destination === "new-sprint" ? newSprintName.trim() : null,
        tasksToMigrate: pendingTasks.map((t) => t.id),
      }
      const response = await fetch("/api/sprints/close", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        handleReset()
        onSprintClosed()
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to close sprint. Please try again.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsClosing(false)
    }
  }

  if (!isOpen || !sprint) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            {/* Step indicator */}
            <div className="flex items-center gap-1.5 mb-1">
              {([1, 2] as Step[]).map((s) => (
                <div
                  key={s}
                  className={cn(
                    "h-1 rounded-full transition-all",
                    s === step ? "w-6 bg-[#007AFF]" : s < step ? "w-3 bg-[#007AFF]/40" : "w-3 bg-[#E5E5E7]"
                  )}
                />
              ))}
              <span className="text-xs text-[#86868B] ml-1">Step {step} of 2</span>
            </div>
            <h3 className="text-base font-bold text-[#1D1D1F]">
              {step === 1 ? "Close Sprint" : "Confirm & Close"}
            </h3>
            <p className="text-xs text-[#86868B] mt-0.5 truncate max-w-xs">{sprint.name}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-[#F5F5F7] rounded-lg transition-all"
          >
            <X className="w-4 h-4 text-[#86868B]" />
          </button>
        </div>

        {/* ─── STEP 1: Task Triage ─── */}
        {step === 1 && (
          <div className="px-6 pb-6 space-y-5">

            {/* Warning for large pending count */}
            {totalPending > 50 && (
              <div className="flex items-start gap-2 p-3 bg-[#FF9500]/8 border border-[#FF9500]/20 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-[#FF9500] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#1D1D1F]">
                  <span className="font-bold">{totalPending} pending tasks</span> — consider reviewing before closing.
                </p>
              </div>
            )}

            {/* 3-column task triage — only if there are pending tasks */}
            {totalPending > 0 ? (
              <>
                <div>
                  <p className="text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-3">
                    Tasks to move ({totalPending})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {/* To Do column */}
                    {(() => {
                      const col = pendingTasks.filter(t => t.status === "todo")
                      return (
                        <div className="bg-[#F5F5F7] rounded-xl p-3 min-h-[80px]">
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-2 h-2 rounded-full bg-[#D1D1D6]" />
                            <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wide">To Do</span>
                            <span className="text-[10px] text-[#86868B] ml-auto font-semibold">{col.length}</span>
                          </div>
                          <div className="space-y-1.5">
                            {col.slice(0, 4).map(t => (
                              <div key={t.id} className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-[#D1D1D6] flex-shrink-0" />
                                <p className="text-[11px] text-[#1D1D1F] truncate leading-tight">{t.title}</p>
                              </div>
                            ))}
                            {col.length > 4 && (
                              <p className="text-[10px] text-[#86868B] pl-2.5">+{col.length - 4} more</p>
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {/* In Progress column */}
                    {(() => {
                      const col = pendingTasks.filter(t => isInProgress(t.status))
                      return (
                        <div className="bg-[#007AFF]/5 rounded-xl p-3 min-h-[80px]">
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-2 h-2 rounded-full bg-[#007AFF]" />
                            <span className="text-[10px] font-bold text-[#007AFF] uppercase tracking-wide">Active</span>
                            <span className="text-[10px] text-[#007AFF] ml-auto font-semibold">{col.length}</span>
                          </div>
                          <div className="space-y-1.5">
                            {col.slice(0, 4).map(t => (
                              <div key={t.id} className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-[#007AFF] flex-shrink-0" />
                                <p className="text-[11px] text-[#1D1D1F] truncate leading-tight">{t.title}</p>
                              </div>
                            ))}
                            {col.length > 4 && (
                              <p className="text-[10px] text-[#007AFF] pl-2.5">+{col.length - 4} more</p>
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {/* In Review column */}
                    {(() => {
                      const col = pendingTasks.filter(t => isInReview(t.status))
                      return (
                        <div className="bg-[#FF9500]/5 rounded-xl p-3 min-h-[80px]">
                          <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-2 h-2 rounded-full bg-[#FF9500]" />
                            <span className="text-[10px] font-bold text-[#FF9500] uppercase tracking-wide">Review</span>
                            <span className="text-[10px] text-[#FF9500] ml-auto font-semibold">{col.length}</span>
                          </div>
                          <div className="space-y-1.5">
                            {col.slice(0, 4).map(t => (
                              <div key={t.id} className="flex items-center gap-1.5">
                                <div className="w-1 h-1 rounded-full bg-[#FF9500] flex-shrink-0" />
                                <p className="text-[11px] text-[#1D1D1F] truncate leading-tight">{t.title}</p>
                              </div>
                            ))}
                            {col.length > 4 && (
                              <p className="text-[10px] text-[#FF9500] pl-2.5">+{col.length - 4} more</p>
                            )}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Destination — "Where should they go?" */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#86868B] uppercase tracking-wide">
                    Where should they go?
                  </p>

                  <button
                    onClick={() => setDestination("backlog")}
                    className={cn(
                      "w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                      destination === "backlog"
                        ? "border-[#007AFF] bg-[#007AFF]/5"
                        : "border-[#E5E5E7] hover:border-[#D1D1D6] bg-white"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      destination === "backlog" ? "bg-[#007AFF]/10" : "bg-[#F5F5F7]"
                    )}>
                      <Package className={cn("w-4 h-4", destination === "backlog" ? "text-[#007AFF]" : "text-[#86868B]")} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm font-semibold", destination === "backlog" ? "text-[#007AFF]" : "text-[#1D1D1F]")}>
                          Move to Backlog
                        </p>
                        <span className="text-[10px] font-bold text-[#34C759] bg-[#34C759]/10 px-1.5 py-0.5 rounded uppercase tracking-wide">
                          Recommended
                        </span>
                      </div>
                      <p className="text-xs text-[#86868B] mt-0.5">Reassess priorities in next planning session</p>
                    </div>
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex-shrink-0",
                      destination === "backlog" ? "border-[#007AFF] bg-[#007AFF]" : "border-[#D1D1D6]"
                    )}>
                      {destination === "backlog" && <div className="w-full h-full rounded-full bg-white scale-[0.4]" />}
                    </div>
                  </button>

                  <button
                    onClick={() => setDestination("new-sprint")}
                    className={cn(
                      "w-full text-left flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                      destination === "new-sprint"
                        ? "border-[#007AFF] bg-[#007AFF]/5"
                        : "border-[#E5E5E7] hover:border-[#D1D1D6] bg-white"
                    )}
                  >
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                      destination === "new-sprint" ? "bg-[#007AFF]/10" : "bg-[#F5F5F7]"
                    )}>
                      <Sparkles className={cn("w-4 h-4", destination === "new-sprint" ? "text-[#007AFF]" : "text-[#86868B]")} />
                    </div>
                    <div className="flex-1">
                      <p className={cn("text-sm font-semibold", destination === "new-sprint" ? "text-[#007AFF]" : "text-[#1D1D1F]")}>
                        Create New Sprint
                      </p>
                      <p className="text-xs text-[#86868B] mt-0.5">Carry tasks forward into a new sprint</p>
                    </div>
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex-shrink-0",
                      destination === "new-sprint" ? "border-[#007AFF] bg-[#007AFF]" : "border-[#D1D1D6]"
                    )}>
                      {destination === "new-sprint" && <div className="w-full h-full rounded-full bg-white scale-[0.4]" />}
                    </div>
                  </button>

                  {/* Sprint name input — inline, only when new-sprint selected */}
                  {destination === "new-sprint" && (
                    <div className="pt-1">
                      <input
                        type="text"
                        value={newSprintName}
                        onChange={(e) => setNewSprintName(e.target.value)}
                        placeholder={`e.g., ${sprint.name.replace(/(\d+)/, (_, n) => String(Number(n) + 1))}`}
                        autoFocus
                        className="w-full px-4 py-3 border border-[#E5E5E7] rounded-xl text-sm text-[#1D1D1F] placeholder:text-[#BDBDBE] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-[#34C759] mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#1D1D1F]">All tasks are done!</p>
                <p className="text-xs text-[#86868B] mt-1">Nothing to migrate — ready to close.</p>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!canProceedToStep2()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#007AFF] text-white font-semibold text-sm rounded-xl hover:opacity-90 disabled:opacity-40 transition-all"
            >
              Review & Confirm
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── STEP 2: Review & Confirm ─── */}
        {step === 2 && (
          <div className="px-6 pb-6 space-y-5">

            {/* What will happen */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#86868B] uppercase tracking-wide">What will happen</p>
              <div className="bg-[#F5F5F7] rounded-xl p-4 space-y-3">
                {doneTasks.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#34C759]/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
                    </div>
                    <p className="text-sm text-[#1D1D1F]">
                      <span className="font-bold">{doneTasks.length}</span> completed {doneTasks.length === 1 ? "task" : "tasks"} archived
                    </p>
                  </div>
                )}
                {totalPending > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#007AFF]/10 flex items-center justify-center flex-shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 text-[#007AFF]" />
                    </div>
                    <p className="text-sm text-[#1D1D1F]">
                      <span className="font-bold">{totalPending}</span> pending {totalPending === 1 ? "task" : "tasks"} moved to{" "}
                      <span className="font-bold">
                        {destination === "backlog" ? "Backlog" : `"${newSprintName}"`}
                      </span>
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#86868B]/10 flex items-center justify-center flex-shrink-0">
                    <X className="w-3.5 h-3.5 text-[#86868B]" />
                  </div>
                  <p className="text-sm text-[#1D1D1F]">
                    Sprint <span className="font-bold">&ldquo;{sprint.name}&rdquo;</span> marked as completed
                  </p>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setStep(1); setError(null) }}
                disabled={isClosing}
                className="flex items-center gap-1.5 px-4 py-3 border border-[#E5E5E7] text-[#1D1D1F] rounded-xl text-sm font-semibold hover:bg-[#F5F5F7] disabled:opacity-50 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleConfirmClose}
                disabled={isClosing}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#FF3B30] text-white font-semibold text-sm rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {isClosing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Closing...
                  </>
                ) : (
                  "Confirm & Close Sprint"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
