"use client"

import { useEffect, useState } from "react"
import { Plus, Download, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { ContentCalendarView } from "@/components/content-calendar-view"
import AddContentModal from "@/components/add-content-modal-cv"
import { MonthlyContentPlannerModal } from "@/components/monthly-content-planner-modal"
import { ContentPipelineOverview } from "@/components/content-pipeline-overview"
import { ContentBucketTracker, type ContentBucket } from "@/components/content-bucket-tracker"

// Get current month
const getCurrentMonth = () => {
  const date = new Date()
  return date.toLocaleString("default", { month: "long" }).toLowerCase()
}

type ClientOption = {
  id: string
  name: string
}


const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]

const TABS = [
  { id: "pipeline", label: "Pipeline Overview" },
  { id: "calendar", label: "Content Calendar" },
  { id: "tracker", label: "Content Tracker" },
]

export default function ContentVisibilityPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMonthlyModal, setShowMonthlyModal] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [selectedClient, setSelectedClient] = useState("All Clients")
  const [activeTab, setActiveTab] = useState("pipeline")
  const [isLoading, setIsLoading] = useState(true)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [buckets, setBuckets] = useState<ContentBucket[]>([])
  const [pageError, setPageError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingRecord, setEditingRecord] = useState<{ id: string; [key: string]: unknown } | null>(null)

  useEffect(() => {
    const loadContentManagementData = async () => {
      try {
        setIsLoading(true)
        setPageError(null)

        const token = localStorage.getItem("sessionToken")
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined

        const currentYear = new Date().getFullYear()
        const bucketsParams = new URLSearchParams({ month: selectedMonth, year: String(currentYear) })
        const selectedClientObj = clients.find(c => c.name === selectedClient)
        if (selectedClientObj) bucketsParams.set("clientId", selectedClientObj.id)

        const [clientsResponse, bucketsResponse] = await Promise.all([
          fetch("/api/clients", { headers }),
          fetch(`/api/content/buckets?${bucketsParams.toString()}`, { headers }),
        ])

        if (!clientsResponse.ok) {
          throw new Error("Failed to load content management data")
        }

        const clientsData = await clientsResponse.json()
        const bucketsData = bucketsResponse.ok ? await bucketsResponse.json() : { buckets: [] }

        setClients(clientsData.clients || [])
        setBuckets(bucketsData.buckets || [])
      } catch (loadError) {
        console.error("[v0] Failed to load content management data:", loadError)
        setPageError(loadError instanceof Error ? loadError.message : "Failed to load content management data")
        setClients([])
      } finally {
        setIsLoading(false)
      }
    }

    loadContentManagementData()
  }, [selectedMonth, selectedClient, refreshKey])

  const clientOptions = ["All Clients", ...clients.map((client) => client.name)]

  return (
    <div className="w-full">
              {/* Header */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
                  <p className="text-sm text-gray-600 mt-2">Plan, schedule, and track content across all clients</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Upload">
                    <Upload className="w-5 h-5" />
                  </button>
                  <button className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Download">
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowMonthlyModal(true)}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add Content
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-6 flex gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:border-gray-400 transition-colors"
                  >
                    {MONTHS.map((month) => (
                      <option key={month} value={month}>
                        {month.charAt(0).toUpperCase() + month.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Client</label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:border-gray-400 transition-colors"
                  >
                    {clientOptions.map((client) => (
                      <option key={client} value={client}>{client}</option>
                    ))}
                  </select>
                </div>
              </div>

              {pageError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {pageError}
                </div>
              )}

              {/* Tab Navigation */}
              <div className="flex gap-1 mb-8 border-b border-gray-200">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                      activeTab === tab.id
                        ? "text-blue-600 border-b-blue-600"
                        : "text-gray-600 border-b-transparent hover:text-gray-900"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === "pipeline" && (
                <ContentPipelineOverview
                  buckets={buckets}
                  selectedClient={selectedClient}
                  month={selectedMonth}
                />
              )}

              {activeTab === "calendar" && (
                <div key="calendar-tab">
                  <ContentCalendarView
                    clientName={selectedClient === "All Clients" ? null : selectedClient}
                    selectedMonth={selectedMonth}
                    refreshKey={refreshKey}
                    onCreatePost={() => setShowMonthlyModal(true)}
                  />
                </div>
              )}

              {activeTab === "tracker" && (
                <div key="tracker-tab">
                  <ContentBucketTracker
                    month={selectedMonth}
                    year={new Date().getFullYear()}
                    clientId={clients.find(c => c.name === selectedClient)?.id || ""}
                    refreshKey={refreshKey}
                    onDataChanged={() => setRefreshKey((currentKey) => currentKey + 1)}
                  />
                </div>
              )}

              {/* Edit Modal - only for editing existing individual records */}
              {showAddModal && (
                <AddContentModal
                  onClose={() => setShowAddModal(false)}
                  initialData={editingRecord}
                  onSuccess={() => {
                    setShowAddModal(false)
                    setEditingRecord(null)
                    setRefreshKey((currentKey) => currentKey + 1)
                    setActiveTab("tracker")
                  }}
                />
              )}

              {/* Monthly Content Planner Modal - for bulk planning */}
              {showMonthlyModal && (
                <MonthlyContentPlannerModal
                  isOpen={showMonthlyModal}
                  onClose={() => setShowMonthlyModal(false)}
                  onSubmit={async (plan) => {
                    try {
                      const token = localStorage.getItem("sessionToken")
                      const response = await fetch("/api/content/buckets", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify(plan),
                      })
                      if (response.ok) {
                        setRefreshKey((currentKey) => currentKey + 1)
                        setShowMonthlyModal(false)
                        setActiveTab("tracker")
                      } else {
                        const err = await response.json()
                        alert(err.error || "Failed to create monthly plan")
                      }
                    } catch (error) {
                      console.error("Failed to submit monthly plan:", error)
                      alert("Error creating monthly plan")
                    }
                  }}
                  clients={clients}
                />
              )}
    </div>
  )
}

