"use client"

import { ChevronDown, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClientOption {
  id: string
  name: string
  pendingCount?: number
  overdueCount?: number
}

interface SprintStats {
  pending: number
  overdue: number
  velocity: number
  completion: number
}

interface SprintManagementHeaderProps {
  clients: ClientOption[]
  selectedClientId: string | null
  selectedClientName?: string
  stats: SprintStats
  onClientChange: (clientId: string) => void
}

export function SprintManagementHeader({
  clients,
  selectedClientId,
  selectedClientName = "Select Client",
  stats,
  onClientChange,
}: SprintManagementHeaderProps) {
  return (
    <div className="bg-white border-b border-[#E5E5E7] px-6 py-6">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-[#1D1D1F]">Sprint Management</h1>
        <p className="text-sm text-[#86868B] mt-1">Manage sprints and track team progress</p>
      </div>

      {/* Client Selector */}
      <div className="mb-8">
        <label className="block text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-2">
          Select Client
        </label>
        <div className="relative inline-block w-full max-w-xs">
          <select
            value={selectedClientId || ""}
            onChange={(e) => onClientChange(e.target.value)}
            className="w-full appearance-none px-4 py-3 bg-white border border-[#E5E5E7] rounded-xl text-sm font-medium text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent cursor-pointer"
          >
            <option value="">Choose a client...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B] pointer-events-none" />
        </div>
      </div>

      {/* Stats Cards */}
      {selectedClientId && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Pending */}
          <div className="bg-[#F5F5F7] rounded-xl p-4 border border-[#E5E5E7]">
            <p className="text-xs text-[#86868B] font-semibold uppercase tracking-wide mb-1">Pending</p>
            <p className="text-2xl font-black text-[#007AFF]">{stats.pending}</p>
            <p className="text-xs text-[#86868B] mt-1">tasks to do</p>
          </div>

          {/* Overdue */}
          <div className="bg-[#F5F5F7] rounded-xl p-4 border border-[#E5E5E7]">
            <p className="text-xs text-[#86868B] font-semibold uppercase tracking-wide mb-1">Overdue</p>
            <p className={cn("text-2xl font-black", stats.overdue > 0 ? "text-[#FF3B30]" : "text-[#34C759]")}>
              {stats.overdue}
            </p>
            <p className="text-xs text-[#86868B] mt-1">at risk</p>
          </div>

          {/* Velocity */}
          <div className="bg-[#F5F5F7] rounded-xl p-4 border border-[#E5E5E7]">
            <p className="text-xs text-[#86868B] font-semibold uppercase tracking-wide mb-1">Velocity</p>
            <p className="text-2xl font-black text-[#007AFF]">{stats.velocity}</p>
            <p className="text-xs text-[#86868B] mt-1">this week</p>
          </div>

          {/* Completion */}
          <div className="bg-[#F5F5F7] rounded-xl p-4 border border-[#E5E5E7]">
            <p className="text-xs text-[#86868B] font-semibold uppercase tracking-wide mb-1">Completion</p>
            <p className="text-2xl font-black text-[#34C759]">{stats.completion}%</p>
            <p className="text-xs text-[#86868B] mt-1">on track</p>
          </div>
        </div>
      )}
    </div>
  )
}
