"use client"

import { useState, useEffect, useCallback } from "react"
import { Minus, Plus, Trash2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ContentBucket {
  id: string
  clientId: string
  clientName: string
  month: string
  year: number
  platform: string
  contentType: string
  ownerId: string
  ownerName: string
  target: number
  productionDone: number
  scheduled: number
  published: number
  notes?: string
}

interface ContentBucketTrackerProps {
  month: string
  year: number
  clientId?: string    // empty string = all clients
  refreshKey: number
  onDataChanged?: () => void
}

const STEPPER_FIELDS = [
  { key: "productionDone", label: "Production Done", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  { key: "scheduled",      label: "Scheduled",        color: "text-blue-600",  bg: "bg-blue-50",  border: "border-blue-200" },
  { key: "published",      label: "Published",        color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
] as const

export function ContentBucketTracker({ month, year, clientId, refreshKey, onDataChanged }: ContentBucketTrackerProps) {
  const [buckets, setBuckets] = useState<ContentBucket[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadBuckets = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const token = localStorage.getItem("sessionToken")
      const params = new URLSearchParams({ month, year: String(year) })
      if (clientId) params.set("clientId", clientId)
      const res = await fetch(`/api/content/buckets?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Failed to load tracker data")
      const data = await res.json()
      setBuckets(data.buckets || [])
    } catch (err) {
      setErrorMsg("Could not load content buckets. Run script 026 in Supabase if the table does not exist yet.")
    } finally {
      setLoading(false)
    }
  }, [month, year, clientId])

  useEffect(() => { loadBuckets() }, [loadBuckets, refreshKey])

  const handleStep = async (bucket: ContentBucket, field: "productionDone" | "scheduled" | "published", delta: number) => {
    const newVal = bucket[field] + delta
    if (newVal < 0) return

    // Optimistic update
    setBuckets(prev => prev.map(b => b.id === bucket.id ? { ...b, [field]: newVal } : b))
    setSavingId(bucket.id)
    setErrorMsg(null)

    try {
      const token = localStorage.getItem("sessionToken")
      const res = await fetch(`/api/content/buckets/${bucket.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productionDone: field === "productionDone" ? newVal : bucket.productionDone,
          scheduled: field === "scheduled" ? newVal : bucket.scheduled,
          published: field === "published" ? newVal : bucket.published,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        // Revert
        setBuckets(prev => prev.map(b => b.id === bucket.id ? { ...b, [field]: bucket[field] } : b))
        setErrorMsg(err.error || "Failed to update")
      }
    } catch {
      setBuckets(prev => prev.map(b => b.id === bucket.id ? { ...b, [field]: bucket[field] } : b))
      setErrorMsg("Network error. Please try again.")
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this content bucket?")) return
    setDeletingId(id)
    try {
      const token = localStorage.getItem("sessionToken")
      await fetch(`/api/content/buckets/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      setBuckets(prev => prev.filter(b => b.id !== id))
      onDataChanged?.()
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading tracker...</p>
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800">Could not load tracker</p>
          <p className="text-sm text-red-600 mt-1">{errorMsg}</p>
        </div>
      </div>
    )
  }

  if (buckets.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-base font-semibold text-gray-700 mb-1">No content plan yet</p>
        <p className="text-sm text-gray-500">Use the Monthly Content Planner to create targets for this month.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600 whitespace-nowrap">Client</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600 whitespace-nowrap">Platform</th>
              <th className="text-left px-5 py-3.5 font-semibold text-gray-600 whitespace-nowrap">Content Type</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600 whitespace-nowrap">Target</th>
              <th className="text-center px-5 py-3.5 font-semibold text-amber-700 whitespace-nowrap">Production Done</th>
              <th className="text-center px-5 py-3.5 font-semibold text-blue-700 whitespace-nowrap">Scheduled</th>
              <th className="text-center px-5 py-3.5 font-semibold text-green-700 whitespace-nowrap">Published</th>
              <th className="text-center px-5 py-3.5 font-semibold text-gray-600 whitespace-nowrap">Progress</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {buckets.map((bucket) => {
              const pct = bucket.target > 0 ? Math.round((bucket.published / bucket.target) * 100) : 0
              const isSaving = savingId === bucket.id

              return (
                <tr key={bucket.id} className={cn("hover:bg-gray-50 transition-colors", isSaving && "opacity-70")}>
                  {/* Client */}
                  <td className="px-5 py-4 font-medium text-gray-900 whitespace-nowrap">{bucket.clientName}</td>

                  {/* Platform */}
                  <td className="px-5 py-4 text-gray-700 whitespace-nowrap">{bucket.platform}</td>

                  {/* Content Type */}
                  <td className="px-5 py-4 text-gray-700 whitespace-nowrap">{bucket.contentType}</td>

                  {/* Target — read-only */}
                  <td className="px-5 py-4 text-center">
                    <span className="inline-block w-10 h-10 bg-gray-100 rounded-lg text-base font-bold text-gray-900 leading-10 text-center">
                      {bucket.target}
                    </span>
                  </td>

                  {/* Production Done stepper */}
                  <td className="px-5 py-4">
                    <Stepper
                      value={bucket.productionDone}
                      max={bucket.target}
                      color="amber"
                      disabled={isSaving}
                      onDecrement={() => handleStep(bucket, "productionDone", -1)}
                      onIncrement={() => handleStep(bucket, "productionDone", +1)}
                    />
                  </td>

                  {/* Scheduled stepper */}
                  <td className="px-5 py-4">
                    <Stepper
                      value={bucket.scheduled}
                      max={bucket.productionDone}
                      color="blue"
                      disabled={isSaving}
                      onDecrement={() => handleStep(bucket, "scheduled", -1)}
                      onIncrement={() => handleStep(bucket, "scheduled", +1)}
                    />
                  </td>

                  {/* Published stepper */}
                  <td className="px-5 py-4">
                    <Stepper
                      value={bucket.published}
                      max={bucket.scheduled}
                      color="green"
                      disabled={isSaving}
                      onDecrement={() => handleStep(bucket, "published", -1)}
                      onIncrement={() => handleStep(bucket, "published", +1)}
                    />
                  </td>

                  {/* Progress */}
                  <td className="px-5 py-4 min-w-[120px]">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{bucket.published}/{bucket.target}</span>
                        <span className="font-semibold text-gray-700">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 30 ? "bg-amber-500" : "bg-red-400"
                          )}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Delete */}
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleDelete(bucket.id)}
                      disabled={deletingId === bucket.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-40"
                      title="Delete bucket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Inline error toast */}
      {errorMsg && (
        <div className="border-t border-red-100 bg-red-50 px-5 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{errorMsg}</p>
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-xs text-red-500 hover:underline">Dismiss</button>
        </div>
      )}
    </div>
  )
}

// ── Stepper sub-component ────────────────────────────────────────────────────

const COLOR_MAP = {
  amber: { btn: "bg-amber-100 hover:bg-amber-200 text-amber-700 disabled:bg-gray-100 disabled:text-gray-300", text: "text-amber-800" },
  blue:  { btn: "bg-blue-100 hover:bg-blue-200 text-blue-700 disabled:bg-gray-100 disabled:text-gray-300",  text: "text-blue-800"  },
  green: { btn: "bg-green-100 hover:bg-green-200 text-green-700 disabled:bg-gray-100 disabled:text-gray-300", text: "text-green-800" },
}

function Stepper({
  value, max, color, disabled, onDecrement, onIncrement,
}: {
  value: number
  max: number
  color: keyof typeof COLOR_MAP
  disabled: boolean
  onDecrement: () => void
  onIncrement: () => void
}) {
  const { btn, text } = COLOR_MAP[color]
  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled || value <= 0}
        className={cn("w-7 h-7 rounded flex items-center justify-center transition-colors", btn)}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className={cn("w-7 text-center font-bold text-base tabular-nums", text)}>{value}</span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled || value >= max}
        className={cn("w-7 h-7 rounded flex items-center justify-center transition-colors", btn)}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
