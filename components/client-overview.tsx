"use client"

import { useState } from "react"
import { AlertTriangle, Zap, TrendingUp, X, ChevronRight, LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { InlineSprintCreator } from "./inline-sprint-creator"
import { SprintSegments } from "./sprint-segments"
import { SprintCloseModal } from "./sprint-close-modal"
import useSWR from "swr"

interface ClientPending {
  clientId: string
  clientName: string
  pendingTaskCount: number
  overdueTasks: number
  tasksDueToday: number
  currentPhase: string
  lastActivity: string
}

interface Sprint {
  id: string
  name: string
  status: "planning" | "active" | "completed"
}

const fetcher = async (url: string) => {
  const token = localStorage.getItem("sessionToken")
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

export function ClientOverview() {
  const [sortBy, setSortBy] = useState<"pending" | "overdue" | "name">("pending")
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)
  const [isCloseSprintModalOpen, setIsCloseSprintModalOpen] = useState(false)
  const [selectedSprintForClose, setSelectedSprintForClose] = useState<Sprint | null>(null)
  const [clientListCollapsed, setClientListCollapsed] = useState(false)

  const { data: clientsData, isLoading: clientsLoading, mutate: mutatePendingClients } = useSWR(
    "/api/clients/pending",
    fetcher
  )

  const { data: sprintsData, mutate: mutateSprints } = useSWR(
    selectedClientId ? `/api/sprints?clientId=${selectedClientId}` : null,
    fetcher
  )

  const clients: ClientPending[] = clientsData?.clients || []
  const sprints: Sprint[] = sprintsData?.sprints || []
  const selectedClient = clients.find((c) => c.clientId === selectedClientId)

  const sortedClients = [...clients].sort((a, b) => {
    if (sortBy === "pending") return b.pendingTaskCount - a.pendingTaskCount
    if (sortBy === "overdue") return b.overdueTasks - a.overdueTasks
    return a.clientName.localeCompare(b.clientName)
  })

  const handleCloseSprint = (sprint: Sprint) => {
    setSelectedSprintForClose(sprint)
    setIsCloseSprintModalOpen(true)
  }

  const handleSprintClosed = () => {
    mutateSprints()
    mutatePendingClients()
  }

  const totalPending = clients.reduce((s, c) => s + c.pendingTaskCount, 0)
  const totalOverdue = clients.reduce((s, c) => s + c.overdueTasks, 0)

  return (
    <div className="flex h-full min-h-0 gap-0">

      {/* ─── LEFT PANEL: Clients ─── */}
      <div
        className={cn(
          "flex flex-col flex-shrink-0 border-r border-[#E5E5E7] transition-all duration-300 bg-[#FAFAFA]",
          clientListCollapsed ? "w-14" : selectedClientId ? "w-72" : "w-full max-w-2xl mx-auto"
        )}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#E5E5E7]">
          {!clientListCollapsed && (
            <div>
              <h1 className="text-base font-bold text-[#1D1D1F]">Sprint Management</h1>
              <p className="text-xs text-[#86868B] mt-0.5">{clients.length} clients</p>
            </div>
          )}
          {selectedClientId && (
            <button
              onClick={() => setClientListCollapsed(v => !v)}
              className="p-1.5 hover:bg-[#E5E5E7] rounded-lg transition-all ml-auto"
              title={clientListCollapsed ? "Expand client list" : "Collapse client list"}
            >
              <ChevronRight className={cn("w-4 h-4 text-[#86868B] transition-transform", clientListCollapsed ? "" : "rotate-180")} />
            </button>
          )}
        </div>

        {!clientListCollapsed && (
          <>
            {/* Summary Bar */}
            <div className="flex gap-2 px-4 py-3 border-b border-[#E5E5E7]">
              <div className="flex-1 flex items-center gap-2 bg-[#007AFF]/8 rounded-lg px-3 py-2">
                <Zap className="w-3.5 h-3.5 text-[#007AFF]" />
                <div>
                  <p className="text-[10px] text-[#007AFF] font-semibold uppercase tracking-wide">Pending</p>
                  <p className="text-lg font-bold text-[#007AFF] leading-none">{totalPending}</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 bg-[#FF3B30]/8 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 text-[#FF3B30]" />
                <div>
                  <p className="text-[10px] text-[#FF3B30] font-semibold uppercase tracking-wide">Overdue</p>
                  <p className="text-lg font-bold text-[#FF3B30] leading-none">{totalOverdue}</p>
                </div>
              </div>
            </div>

            {/* Sort Pills */}
            <div className="flex gap-1.5 px-4 py-3 border-b border-[#E5E5E7]">
              {(["pending", "overdue", "name"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                    sortBy === s
                      ? "bg-[#1D1D1F] text-white"
                      : "bg-[#E5E5E7] text-[#86868B] hover:text-[#1D1D1F]"
                  )}
                >
                  {s === "pending" ? "Most Pending" : s === "overdue" ? "Overdue" : "A–Z"}
                </button>
              ))}
            </div>

            {/* Client List */}
            <div className="flex-1 overflow-y-auto">
              {clientsLoading ? (
                <div className="px-4 py-8 text-center text-sm text-[#86868B]">Loading clients...</div>
              ) : sortedClients.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[#86868B]">No clients found</div>
              ) : (
                sortedClients.map((client) => {
                  const isSelected = selectedClientId === client.clientId
                  const hasOverdue = client.overdueTasks > 0
                  return (
                    <button
                      key={client.clientId}
                      onClick={() => {
                        setSelectedClientId(client.clientId)
                        setClientListCollapsed(false)
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3.5 border-b border-[#F0F0F0] transition-all group",
                        isSelected
                          ? "bg-[#007AFF]/6 border-l-2 border-l-[#007AFF]"
                          : "hover:bg-white border-l-2 border-l-transparent"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm font-semibold truncate",
                            isSelected ? "text-[#007AFF]" : "text-[#1D1D1F]"
                          )}>
                            {client.clientName}
                          </p>
                          <p className="text-xs text-[#86868B] mt-0.5 truncate">{client.currentPhase}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {hasOverdue && (
                            <span className="flex items-center gap-1 text-xs font-bold text-[#FF3B30]">
                              <AlertTriangle className="w-3 h-3" />
                              {client.overdueTasks}
                            </span>
                          )}
                          <span className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-full",
                            client.pendingTaskCount > 0
                              ? "bg-[#007AFF]/10 text-[#007AFF]"
                              : "bg-[#E5E5E7] text-[#86868B]"
                          )}>
                            {client.pendingTaskCount}
                          </span>
                          <ChevronRight className={cn("w-3.5 h-3.5 text-[#D1D1D6] group-hover:text-[#86868B] transition-all", isSelected && "text-[#007AFF]")} />
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* Collapsed state — show client initials vertically */}
        {clientListCollapsed && (
          <div className="flex-1 overflow-y-auto py-2 flex flex-col items-center gap-1">
            {sortedClients.map((client) => {
              const isSelected = selectedClientId === client.clientId
              return (
                <button
                  key={client.clientId}
                  onClick={() => {
                    setSelectedClientId(client.clientId)
                    setClientListCollapsed(false)
                  }}
                  title={client.clientName}
                  className={cn(
                    "w-9 h-9 rounded-lg text-xs font-bold transition-all",
                    isSelected ? "bg-[#007AFF] text-white" : "bg-[#E5E5E7] text-[#86868B] hover:bg-[#D1D1D6]"
                  )}
                >
                  {client.clientName.charAt(0).toUpperCase()}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── RIGHT PANEL: Sprint Details ─── */}
      {selectedClientId && selectedClient ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* Right Panel Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E7] bg-white flex-shrink-0">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1D1D1F]">{selectedClient.clientName}</h2>
                <p className="text-xs text-[#86868B] mt-0.5">{selectedClient.currentPhase}</p>
              </div>
              {/* Quick stats inline */}
              <div className="hidden md:flex items-center gap-3 ml-4">
                <div className="flex items-center gap-1.5 bg-[#007AFF]/8 px-3 py-1.5 rounded-lg">
                  <Zap className="w-3.5 h-3.5 text-[#007AFF]" />
                  <span className="text-sm font-bold text-[#007AFF]">{selectedClient.pendingTaskCount}</span>
                  <span className="text-xs text-[#007AFF]">pending</span>
                </div>
                {selectedClient.overdueTasks > 0 && (
                  <div className="flex items-center gap-1.5 bg-[#FF3B30]/8 px-3 py-1.5 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#FF3B30]" />
                    <span className="text-sm font-bold text-[#FF3B30]">{selectedClient.overdueTasks}</span>
                    <span className="text-xs text-[#FF3B30]">overdue</span>
                  </div>
                )}
                {selectedClient.tasksDueToday > 0 && (
                  <div className="flex items-center gap-1.5 bg-[#34C759]/8 px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-bold text-[#34C759]">{selectedClient.tasksDueToday}</span>
                    <span className="text-xs text-[#34C759]">due today</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedClientId(null)}
              className="p-2 hover:bg-[#F5F5F7] rounded-lg transition-all"
            >
              <X className="w-4 h-4 text-[#86868B]" />
            </button>
          </div>

          {/* Sprint Content — scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-6 space-y-8">

              {/* Sprint List */}
              <SprintSegments
                sprints={sprints}
                tasks={[]}
                backlogTasks={[]}
                isLoading={false}
                onCloseSprint={handleCloseSprint}
              />

              {/* Divider + Create Sprint */}
              <div className="pt-2 border-t border-[#E5E5E7]">
                <p className="text-xs font-semibold text-[#86868B] uppercase tracking-wide mb-4">New Sprint</p>
                <InlineSprintCreator
                  clientId={selectedClientId}
                  sprints={sprints}
                  selectedSprintId={selectedSprintId}
                  onSprintChange={setSelectedSprintId}
                  onSprintCreated={() => mutateSprints()}
                />
              </div>

            </div>
          </div>
        </div>
      ) : !clientListCollapsed && (
        /* Empty state when no client selected and list is showing full-width */
        <div className="hidden" />
      )}

      {selectedClientId === null && (
        /* Full-width empty state when nothing selected */
        <div className="hidden" />
      )}

      {/* Sprint Close Modal */}
      <SprintCloseModal
        isOpen={isCloseSprintModalOpen}
        onClose={() => setIsCloseSprintModalOpen(false)}
        sprint={selectedSprintForClose}
        tasks={[]}
        sprints={sprints}
        onSprintClosed={handleSprintClosed}
      />
    </div>
  )
}
