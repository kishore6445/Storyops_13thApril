"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { SprintManagementHeader } from "./sprint-management-header"
import { SprintList } from "./sprint-list"
import { SprintDetailModal } from "./sprint-detail-modal"
import { InlineSprintCreator } from "./inline-sprint-creator"
import { SprintCloseModal } from "./sprint-close-modal"
import { TaskModalWithPKR } from "./task-modal-with-pkr"
import useSWR from "swr"

interface ClientPending {
  clientId: string
  clientName: string
  pendingTaskCount: number
  overdueTasks: number
  tasksDueToday: number
}

interface Sprint {
  id: string
  name: string
  status: "planning" | "active" | "completed" | "archived"
  start_date: string
  end_date: string
}

const fetcher = async (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

export function ClientOverview() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null)
  const [showSprintDetailModal, setShowSprintDetailModal] = useState(false)
  const [showCreateSprintForm, setShowCreateSprintForm] = useState(false)
  const [isCloseSprintModalOpen, setIsCloseSprintModalOpen] = useState(false)
  const [selectedSprintForClose, setSelectedSprintForClose] = useState<Sprint | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)

  // Fetch clients
  const { data: clientsData, isLoading: clientsLoading } = useSWR(
    "/api/clients/pending",
    fetcher
  )

  // Fetch sprints for selected client
  const { data: sprintsData, mutate: mutateSprints } = useSWR(
    selectedClientId ? `/api/sprints?clientId=${selectedClientId}` : null,
    fetcher
  )

  // Fetch tasks for selected client and sprint
  const { data: tasksData } = useSWR(
    selectedClientId ? `/api/account-manager/tasks?sprintId=${selectedSprintId}&clientId=${selectedClientId}` : null,
    fetcher
  )

  // Fetch team members for selected client
  const { data: teamMembersData } = useSWR(
    selectedClientId ? `/api/clients/${selectedClientId}/team-members` : null,
    fetcher,
    { onError: () => console.log("[v0] Team members fetch failed, continuing without") }
  )

  // Fetch sprints for selected client
  const { data: sprintsData, mutate: mutateSprints } = useSWR(
    selectedClientId ? `/api/sprints?clientId=${selectedClientId}` : null,
    fetcher
  )

  // Fetch tasks for selected client
  const { data: tasksData, isLoading: tasksLoading } = useSWR(
    selectedClientId ? `/api/tasks?clientId=${selectedClientId}` : null,
    fetcher
  )

  // Fetch stats for selected client/sprint
  const { data: statsData } = useSWR(
    selectedClientId ? `/api/account-manager/stats?clientId=${selectedClientId}` : null,
    fetcher
  )

  const clients: ClientPending[] = clientsData?.clients || []
  const sprints: Sprint[] = sprintsData?.sprints || []

  // Transform clients for SprintManagementHeader
  const clientOptions = clients.map(client => ({
    id: client.clientId,
    name: client.clientName,
    pendingCount: client.pendingTaskCount,
    overdueCount: client.overdueTasks,
  }))

  // Map raw API tasks
  const allTasks = (tasksData?.tasks || []).map((t: any) => ({
    id: t.id,
    title: t.title,
    dueDate: t.due_date || "",
    assignedTo: t.assigned_to || "",
    phase: t.phase || "",
    priority: t.priority || "medium",
    status: t.status || "todo",
    sprintId: t.sprint_id || undefined,
  }))

  // Get selected sprint
  const selectedSprint = sprints.find((s) => s.id === selectedSprintId)

  // Get tasks for selected sprint
  const sprintTasks = selectedSprint
    ? allTasks.filter((t: any) => t.sprintId === selectedSprintId)
    : []

  // Get selected client
  const selectedClient = clients.find((c) => c.clientId === selectedClientId)

  // Calculate stats
  const stats = {
    pending: statsData?.todoCount || 0,
    overdue: statsData?.atRiskTasks || 0,
    velocity: statsData?.weeklyVelocity || 0,
    completion: statsData?.completionRate || 0,
  }

  const handleCreateSprint = () => {
    setShowCreateSprintForm(true)
  }

  const handleSprintSelect = (sprintId: string) => {
    setSelectedSprintId(sprintId)
    setShowSprintDetailModal(true)
  }

  const handleCloseSprint = () => {
    if (selectedSprint) {
      setSelectedSprintForClose(selectedSprint)
      setIsCloseSprintModalOpen(true)
    }
  }

  const handleSprintClosed = () => {
    mutateSprints()
    setSelectedSprintId(null)
    setShowSprintDetailModal(false)
    setIsCloseSprintModalOpen(false)
    setSelectedSprintForClose(null)
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <SprintManagementHeader
        clients={clientOptions}
        selectedClientId={selectedClientId}
        selectedClientName={selectedClient?.clientName}
        stats={stats}
        onClientChange={(clientId) => {
          setSelectedClientId(clientId)
          setSelectedSprintId(null)
          setShowSprintDetailModal(false)
        }}
      />

      {/* Main Content */}
      {selectedClientId ? (
        <div className="flex-1 flex flex-col min-h-0">
          {showCreateSprintForm ? (
            /* Create Sprint Form */
            <div className="px-6 py-6 bg-white border-b border-[#E5E5E7] flex-shrink-0">
              <div className="max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#1D1D1F] uppercase tracking-wide">
                    Create New Sprint
                  </h3>
                  <button
                    onClick={() => setShowCreateSprintForm(false)}
                    className="text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <InlineSprintCreator
                  clientId={selectedClientId}
                  clientName={selectedClient?.clientName}
                  sprints={sprints}
                  selectedSprintId={selectedSprintId}
                  onSprintChange={setSelectedSprintId}
                  onSprintCreated={() => {
                    mutateSprints()
                    setShowCreateSprintForm(false)
                  }}
                />
              </div>
            </div>
          ) : null}

          {/* Sprint List */}
          <SprintList
            sprints={sprints}
            selectedSprintId={selectedSprintId}
            onSprintSelect={handleSprintSelect}
            onCreateSprint={handleCreateSprint}
          />
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex items-center justify-center bg-[#F5F5F7]">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-12 h-12 bg-[#E5E5E7] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-[#86868B]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[#1D1D1F] mb-2">Select a client</h3>
            <p className="text-sm text-[#86868B]">
              Choose a client from the dropdown above to view and manage their sprints.
            </p>
          </div>
        </div>
      )}

      {/* Sprint Detail Modal */}
      <SprintDetailModal
        isOpen={showSprintDetailModal}
        onClose={() => {
          setShowSprintDetailModal(false)
        }}
        sprint={selectedSprint || null}
        tasks={sprintTasks}
        isLoading={tasksLoading}
        onTaskClick={(task) => {
          setSelectedTask(task)
          setShowTaskModal(true)
        }}
      />

      {/* Task Edit Modal */}
      <TaskModalWithPKR
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false)
          setSelectedTask(null)
        }}
        onSave={async (taskData) => {
          if (!selectedTask) return
          try {
            const res = await fetch(`/api/tasks/${selectedTask.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: taskData.title,
                description: taskData.description,
                priority: taskData.priority,
                assigned_to: taskData.assigneeIds[0],
                due_date: taskData.dueDate,
                due_time: taskData.dueTime,
                promised_date: taskData.promisedDate,
                promised_time: taskData.promisedTime,
              }),
            })
            if (res.ok) {
              setShowTaskModal(false)
              setSelectedTask(null)
              // Refresh sprint tasks
              const key = selectedClientId && selectedSprintId 
                ? `/api/account-manager/tasks?sprintId=${selectedSprintId}&clientId=${selectedClientId}`
                : null
              if (key) {
                const { mutate } = useSWR(key, fetcher)
                mutate()
              }
            }
          } catch (error) {
            console.error("Failed to update task:", error)
          }
        }}
        clientId={selectedClientId || undefined}
        sprintId={selectedSprintId || undefined}
        task={selectedTask}
        teamMembers={teamMembersData?.team_members || []}
      />

      {/* Sprint Close Modal */}
      <SprintCloseModal
        isOpen={isCloseSprintModalOpen}
        onClose={() => setIsCloseSprintModalOpen(false)}
        sprint={selectedSprintForClose}
        tasks={sprintTasks}
        sprints={sprints}
        onSprintClosed={handleSprintClosed}
      />
    </div>
  )
}
