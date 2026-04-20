"use client"

import { useState } from "react"
import { Search, Archive, RotateCcw, Trash2 } from "lucide-react"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { AuthGuard } from "@/components/auth-guard"
import { TopNav } from "@/components/top-nav"
import { Sidebar } from "@/components/sidebar"

interface ArchivedTask {
  id: string
  title: string
  status: string
  archived_at: string
  archived_by?: string
  client_id?: string
}

const fetcher = (url: string) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then((res) => res.json())
}

export default function ArchivePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [restoringId, setRestoringId] = useState<string | null>(null)

  const { data: archiveData, mutate } = useSWR(
    `/api/tasks/archived?search=${searchQuery}`,
    fetcher
  )

  const archivedTasks: ArchivedTask[] = archiveData?.data || []

  const handleRestore = async (taskId: string) => {
    setRestoringId(taskId)
    try {
      const response = await fetch("/api/tasks/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, action: "restore" }),
      })

      if (response.ok) {
        mutate()
        setSelectedTasks(prev => {
          const newSet = new Set(prev)
          newSet.delete(taskId)
          return newSet
        })
      }
    } catch (error) {
      console.error("[v0] Error restoring task:", error)
    } finally {
      setRestoringId(null)
    }
  }

  const handleSelectAll = () => {
    if (selectedTasks.size === archivedTasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(archivedTasks.map(t => t.id)))
    }
  }

  const handleToggleSelect = (taskId: string) => {
    const newSet = new Set(selectedTasks)
    if (newSet.has(taskId)) {
      newSet.delete(taskId)
    } else {
      newSet.add(taskId)
    }
    setSelectedTasks(newSet)
  }

  const handleRestoreSelected = async () => {
    try {
      await Promise.all(
        Array.from(selectedTasks).map(taskId =>
          fetch("/api/tasks/archive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId, action: "restore" }),
          })
        )
      )
      mutate()
      setSelectedTasks(new Set())
    } catch (error) {
      console.error("[v0] Error bulk restoring:", error)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FAFBFC]">
        <TopNav />
        <div className="flex">
          <Sidebar currentPhase="archive" onPhaseChange={() => {}} />
          <main className="flex-1 ml-64 mt-16 [@media(max-width:768px)]:ml-20">
            <div className="flex-1 overflow-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Archive className="w-8 h-8 text-gray-700" />
            <h1 className="text-3xl font-bold text-gray-900">Archive</h1>
          </div>
          <p className="text-gray-600">View and restore completed tasks that have been archived</p>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search archived tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {selectedTasks.size > 0 && (
            <button
              onClick={handleRestoreSelected}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restore ({selectedTasks.size})
            </button>
          )}
        </div>

        {/* Archive List */}
        {archivedTasks.length === 0 ? (
          <div className="text-center py-16">
            <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No archived tasks</p>
            <p className="text-gray-500 text-sm">Completed tasks will appear here when archived</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-600">
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTasks.size === archivedTasks.length && archivedTasks.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border border-gray-300 cursor-pointer"
                />
              </div>
              <div className="col-span-5">Task</div>
              <div className="col-span-3">Archived Date</div>
              <div className="col-span-3">Actions</div>
            </div>

            {/* Task Rows */}
            <div className="divide-y divide-gray-200">
              {archivedTasks.map((task) => (
                <div
                  key={task.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center"
                >
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={() => handleToggleSelect(task.id)}
                      className="w-4 h-4 rounded border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div className="col-span-5">
                    <p className="font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.id}</p>
                  </div>
                  <div className="col-span-3">
                    <p className="text-sm text-gray-600">
                      {new Date(task.archived_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="col-span-3 flex gap-2">
                    <button
                      onClick={() => handleRestore(task.id)}
                      disabled={restoringId === task.id}
                      className={cn(
                        "px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2",
                        restoringId === task.id
                          ? "bg-gray-100 text-gray-500"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      )}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
