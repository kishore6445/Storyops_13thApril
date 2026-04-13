"use client"

import { useState } from "react"
import { X, Plus, Minus } from "lucide-react"

const PLATFORMS = ["Instagram", "Facebook", "Twitter", "LinkedIn", "TikTok", "YouTube", "Email", "Blog"]
const CONTENT_TYPES = ["Reel", "Post", "Story", "Video", "Article", "Newsletter", "PDF", "Image"]

interface MonthlyPlannerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  clients: Array<{ id: string; name: string }>
}

export function MonthlyContentPlannerModal({
  isOpen,
  onClose,
  onSubmit,
  clients,
}: MonthlyPlannerProps) {
  const [clientId, setClientId] = useState("")
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7))
  const [notes, setNotes] = useState("")
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  if (!isOpen) return null

  const handleAddQuantity = (platform: string, contentType: string) => {
    const key = `${platform}|${contentType}`
    setQuantities(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + 1
    }))
  }

  const handleRemoveQuantity = (platform: string, contentType: string) => {
    const key = `${platform}|${contentType}`
    setQuantities(prev => {
      const newVal = (prev[key] || 0) - 1
      if (newVal <= 0) {
        const { [key]: removed, ...rest } = prev
        return rest
      }
      return { ...prev, [key]: newVal }
    })
  }

  const totalItems = Object.values(quantities).reduce((sum, val) => sum + val, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientId) {
      alert("Please select a client")
      return
    }
    if (totalItems === 0) {
      alert("Please add at least one content item")
      return
    }

    await onSubmit({
      client_id: clientId,
      month,
      items: quantities,
      notes,
    })

    setClientId("")
    setMonth(new Date().toISOString().substring(0, 7))
    setNotes("")
    setQuantities({})
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-screen overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-white">Monthly Content Planner</h2>
            <p className="text-emerald-100 mt-1">Plan all content for the month in one place</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-emerald-500 rounded-lg transition text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Top Controls */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Client *
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none font-medium"
              >
                <option value="">Select a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Month *
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Content Grid */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Content Planning</h3>
              <div className="bg-emerald-100 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-600">Total Items:</p>
                <p className="text-2xl font-bold text-emerald-600">{totalItems}</p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="bg-gray-100 border-2 border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Content Type</th>
                    {PLATFORMS.map(platform => (
                      <th key={platform} className="bg-gray-100 border-2 border-gray-300 px-4 py-3 text-center font-semibold text-gray-700 text-sm">
                        {platform}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CONTENT_TYPES.map(contentType => (
                    <tr key={contentType}>
                      <td className="bg-emerald-50 border-2 border-gray-300 px-4 py-3 font-semibold text-gray-900">{contentType}</td>
                      {PLATFORMS.map(platform => {
                        const key = `${platform}|${contentType}`
                        const qty = quantities[key] || 0
                        return (
                          <td key={key} className="border-2 border-gray-300 px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleRemoveQuantity(platform, contentType)}
                                disabled={qty === 0}
                                className="p-1 bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:cursor-not-allowed rounded transition text-red-600 disabled:text-gray-400"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-bold text-lg text-gray-900">{qty}</span>
                              <button
                                type="button"
                                onClick={() => handleAddQuantity(platform, contentType)}
                                className="p-1 bg-emerald-100 hover:bg-emerald-200 rounded transition text-emerald-600"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:outline-none resize-none"
              rows={3}
              placeholder="Add any notes about this monthly plan..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end pt-6 border-t-2 border-gray-300">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition"
            >
              Create Monthly Plan ({totalItems} items)
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
