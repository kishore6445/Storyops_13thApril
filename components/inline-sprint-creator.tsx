"use client"

import { useState, useMemo, useEffect } from "react"
import { Plus, X, Sparkles } from "lucide-react"
import { generateSprintName, getNextSequenceNumber, getNextWeekMonday, getNextWeekSaturday } from "@/lib/sprint-naming"

interface InlineSprintCreatorProps {
  clientId?: string
  clientName?: string
  sprints: Array<{ id: string; name: string; start_date: string; end_date: string; status: string }>
  selectedSprintId?: string
  onSprintChange: (sprintId: string | null) => void
  onSprintCreated?: () => void
}

export function InlineSprintCreator({
  clientId,
  clientName = "Client",
  sprints,
  selectedSprintId,
  onSprintChange,
  onSprintCreated,
}: InlineSprintCreatorProps) {
  const [showForm, setShowForm] = useState(false)
  const [sprintName, setSprintName] = useState("")
  const [useAutoName, setUseAutoName] = useState(true)
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calculate auto-generated sprint name
  const autoSprintName = useMemo(() => {
    if (!clientName) return ""
    const nextSeq = getNextSequenceNumber(sprints)
    const nextMonday = getNextWeekMonday()
    const nextSaturday = getNextWeekSaturday()
    return generateSprintName(clientName, nextSeq, nextMonday, nextSaturday)
  }, [clientName, sprints])

  // Auto-update form when toggling auto-name
  useEffect(() => {
    if (useAutoName) {
      setSprintName(autoSprintName)
      setStartDate(getNextWeekMonday().toISOString().split("T")[0])
      setEndDate(getNextWeekSaturday().toISOString().split("T")[0])
    }
  }, [useAutoName, autoSprintName])

  const handleCreateSprint = async () => {
    if (!sprintName.trim() || !clientId) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("sessionToken")
      const response = await fetch("/api/sprints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId,
          name: sprintName,
          start_date: startDate,
          end_date: endDate,
          status: "planning",
        }),
      })

      if (response.ok) {
        const newSprint = await response.json()
        setSprintName("")
        setStartDate(new Date().toISOString().split("T")[0])
        setEndDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        setShowForm(false)
        onSprintCreated?.()
      }
    } catch (error) {
      console.error("[v0] Error creating sprint:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedSprint = sprints.find((s) => s.id === selectedSprintId)

  return (
    <div className="space-y-3">
      {/* Current Sprint Display */}
      {selectedSprint ? (
        <div className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded-lg">
          <div>
            <p className="text-xs text-[#86868B] uppercase tracking-wide">Active Sprint</p>
            <p className="text-sm font-medium text-[#1D1D1F]">{selectedSprint.name}</p>
            <p className="text-xs text-[#86868B] mt-1">
              {selectedSprint.start_date} - {selectedSprint.end_date}
            </p>
          </div>
          <button
            onClick={() => onSprintChange(null)}
            className="p-1 hover:bg-white rounded transition-all"
          >
            <X className="w-4 h-4 text-[#86868B]" />
          </button>
        </div>
      ) : sprints.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-[#86868B] uppercase tracking-wide">Select Sprint</p>
          <div className="space-y-1">
            {sprints.map((sprint) => (
              <button
                key={sprint.id}
                onClick={() => onSprintChange(sprint.id)}
                className="w-full text-left p-2 hover:bg-[#F5F5F7] rounded transition-all text-sm text-[#1D1D1F]"
              >
                <span className="font-medium">{sprint.name}</span>
                <span className="text-xs text-[#86868B] ml-2">
                  {sprint.start_date} - {sprint.end_date}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Create Sprint Form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-[#E5E5E7] rounded-lg hover:bg-[#F5F5F7] transition-all text-sm font-medium text-[#1D1D1F]"
        >
          <Plus className="w-4 h-4" />
          Create Sprint
        </button>
      ) : (
        <div className="p-4 border border-[#E5E5E7] rounded-lg bg-white space-y-3">
          {/* Auto-naming toggle with preview */}
          <div className="flex items-center gap-2 p-2 bg-[#F5F5F7] rounded-lg">
            <input
              type="checkbox"
              id="auto-name"
              checked={useAutoName}
              onChange={(e) => setUseAutoName(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <label htmlFor="auto-name" className="flex items-center gap-2 cursor-pointer flex-1">
              <Sparkles className="w-4 h-4 text-[#007AFF]" />
              <span className="text-xs font-medium text-[#1D1D1F]">Auto-generate sprint name</span>
            </label>
          </div>

          {/* Sprint Name Input */}
          <div>
            <label className="block text-xs font-medium text-[#1D1D1F] mb-1">Sprint Name</label>
            {useAutoName ? (
              <div className="px-3 py-2 text-sm bg-[#F5F5F7] border border-[#E5E5E7] rounded text-[#1D1D1F] font-medium">
                {sprintName || autoSprintName}
              </div>
            ) : (
              <input
                type="text"
                value={sprintName}
                onChange={(e) => setSprintName(e.target.value)}
                placeholder="e.g., Sprint 1_WAR_Apr27-May3"
                className="w-full px-3 py-2 text-sm border border-[#E5E5E7] rounded focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#1D1D1F] mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={useAutoName}
                className="w-full px-3 py-2 text-sm border border-[#E5E5E7] rounded focus:outline-none focus:ring-2 focus:ring-[#007AFF] disabled:bg-[#F5F5F7] disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1D1D1F] mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={useAutoName}
                className="w-full px-3 py-2 text-sm border border-[#E5E5E7] rounded focus:outline-none focus:ring-2 focus:ring-[#007AFF] disabled:bg-[#F5F5F7] disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 px-3 py-2 text-sm border border-[#E5E5E7] rounded hover:bg-[#F5F5F7] transition-all text-[#1D1D1F] font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSprint}
              disabled={!sprintName.trim() || isSubmitting}
              className="flex-1 px-3 py-2 text-sm bg-[#007AFF] text-white rounded hover:opacity-90 disabled:opacity-50 transition-all font-medium"
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
