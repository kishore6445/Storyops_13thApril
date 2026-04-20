"use client"

import { useState, useEffect } from "react"
import { Plus, Download, Upload } from "lucide-react"
import ContentVisibilityTable from "@/components/content-visibility-table"
import AddContentModal from "@/components/add-content-modal-cv"
import { MonthlyContentPlannerModal } from "@/components/monthly-content-planner-modal"
import type { ContentRecordListItem } from "@/lib/content-records"

export default function ContentTrackerPage() {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMonthlyModal, setShowMonthlyModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingRecord, setEditingRecord] = useState<ContentRecordListItem | null>(null)
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([])
  const [isLoadingClients, setIsLoadingClients] = useState(true)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients")
        if (response.ok) {
          const data = await response.json()
          setClients(data.clients || [])
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error)
      } finally {
        setIsLoadingClients(false)
      }
    }
    fetchClients()
  }, [])

  return (
    <div className="w-full max-w-7xl">

              {/* Header */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Content Tracker</h1>
                  <p className="text-sm text-gray-600 mt-2">
                    Monitor content workflow and identify blockers
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Upload className="w-5 h-5" />
                  </button>
                  <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowMonthlyModal(true)}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add Content
                  </button>
                </div>
              </div>

              <ContentVisibilityTable
                refreshKey={refreshKey}
                onEdit={(record) => {
                  setEditingRecord(record)
                  setShowEditModal(true)
                }}
              />

              {showEditModal && (
                <AddContentModal
                  onClose={() => setShowEditModal(false)}
                  initialData={editingRecord}
                  onSuccess={() => {
                    setShowEditModal(false)
                    setEditingRecord(null)
                    setRefreshKey((k) => k + 1)
                  }}
                />
              )}

              {showMonthlyModal && (
                <MonthlyContentPlannerModal
                  isOpen={showMonthlyModal}
                  onClose={() => setShowMonthlyModal(false)}
                  onSubmit={async (plan) => {
                    const res = await fetch("/api/content/monthly-plans", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(plan),
                    })
                    if (res.ok) {
                      setRefreshKey((k) => k + 1)
                      setShowMonthlyModal(false)
                    } else {
                      alert("Failed to create monthly plan")
                    }
                  }}
                  clients={clients}
                />
              )}

    </div>
  )
}
