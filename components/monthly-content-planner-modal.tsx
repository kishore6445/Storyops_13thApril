"use client"

import { useState, useMemo } from "react"
import { X, Plus, Minus } from "lucide-react"

interface MonthlyContentPlannerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (plan: MonthlyPlan) => void
  clients: Array<{ id: string; name: string }>
  platforms: string[]
  contentTypes: string[]
}

interface MonthlyPlan {
  clientId: string
  month: string
  year: string
  items: Array<{
    platform: string
    contentType: string
    quantity: number
  }>
  notes: string
}

const PLATFORMS = [
  "Instagram",
  "Facebook",
  "Twitter",
  "LinkedIn",
  "TikTok",
  "YouTube",
  "Email",
  "Blog",
  "Newsletter",
]

const CONTENT_TYPES = [
  "Reel",
  "Post",
  "Story",
  "Video",
  "Article",
  "Newsletter",
  "PDF",
  "Image",
  "Carousel",
  "Infographic",
  "Case Study",
]

export function MonthlyContentPlannerModal({
  isOpen,
  onClose,
  onSubmit,
  clients,
}: MonthlyContentPlannerProps) {
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split("T")[0].slice(0, 7))
  const [notes, setNotes] = useState("")
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const months = useMemo(() => {
    const result: Array<{ value: string; label: string }> = []
    const now = new Date()
    for (let i = -2; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const value = date.toISOString().split("T")[0].slice(0, 7)
      const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      result.push({ value, label })
    }
    return result
  }, [])

  const year = selectedMonth.split("-")[0] || new Date().getFullYear().toString()

  const totalItems = useMemo(() => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0)
  }, [quantities])

  const handleQuantityChange = (platform: string, contentType: string, delta: number) => {
    const key = `${platform}-${contentType}`
    const current = quantities[key] || 0
    const newValue = Math.max(0, current + delta)
    setQuantities((prev) => {
      const updated = { ...prev }
      if (newValue === 0) {
        delete updated[key]
      } else {
        updated[key] = newValue
      }
      return updated
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient) {
      alert("Please select a client")
      return
    }
    if (totalItems === 0) {
      alert("Please add at least one content item")
      return
    }

    const items = Object.entries(quantities).map(([key, quantity]) => {
      const [platform, contentType] = key.split("-")
      return { platform, contentType, quantity }
    })

    onSubmit({
      clientId: selectedClient,
      month: selectedMonth.split("-")[1] || "",
      year: year,
      items,
      notes,
    })

    // Reset form
    setSelectedClient("")
    setSelectedMonth(new Date().toISOString().split("T")[0].slice(0, 7))
    setNotes("")
    setQuantities({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b-2 border-emerald-300 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Monthly Content Planner</h2>
            <p className="text-sm text-slate-600 mt-1">Plan all your content for the month in one go</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-emerald-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Top Section: Client, Month, Year */}
          <div className="grid grid-cols-3 gap-4">
            {/* Client */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Client <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select a client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Month <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Year</label>
              <input
                type="text"
                value={year}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-slate-600"
              />
            </div>
          </div>

          {/* Content Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Content Plan</h3>
              <div className="text-sm font-medium text-emerald-600">
                Total Items: <span className="text-lg font-bold">{totalItems}</span>
              </div>
            </div>

            {/* Grid Header */}
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Column Headers */}
                <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: "1fr " + PLATFORMS.map(() => "1fr").join(" ") }}>
                  <div className="p-2 font-semibold text-slate-700 text-sm">Content Type</div>
                  {PLATFORMS.map((platform) => (
                    <div key={platform} className="p-2 font-semibold text-slate-700 text-sm text-center">
                      {platform}
                    </div>
                  ))}
                </div>

                {/* Content Type Rows */}
                {CONTENT_TYPES.map((contentType) => (
                  <div key={contentType} className="grid gap-2 mb-2" style={{ gridTemplateColumns: "1fr " + PLATFORMS.map(() => "1fr").join(" ") }}>
                    <div className="p-2 font-medium text-slate-700 text-sm bg-slate-50 rounded">
                      {contentType}
                    </div>
                    {PLATFORMS.map((platform) => {
                      const key = `${platform}-${contentType}`
                      const quantity = quantities[key] || 0
                      return (
                        <div
                          key={key}
                          className="p-2 border border-gray-200 rounded flex items-center justify-center gap-2"
                        >
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(platform, contentType, -1)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            disabled={quantity === 0}
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>
                          <span className="w-8 text-center font-semibold text-slate-700">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(platform, contentType, 1)}
                            className="p-1 hover:bg-emerald-100 rounded transition-colors"
                          >
                            <Plus className="w-4 h-4 text-emerald-600" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              rows={3}
              placeholder="Any notes about this monthly plan..."
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium transition-colors"
            >
              Create Monthly Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
