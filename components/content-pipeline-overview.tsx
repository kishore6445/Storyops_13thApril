"use client"

import { cn } from "@/lib/utils"
import type { ContentBucket } from "./content-bucket-tracker"

interface ContentPipelineOverviewProps {
  buckets: ContentBucket[]
  selectedClient: string
  month: string
}

export function ContentPipelineOverview({ buckets, selectedClient, month }: ContentPipelineOverviewProps) {
  // Aggregate totals from buckets
  const totals = buckets.reduce(
    (acc, b) => ({
      target: acc.target + b.target,
      productionDone: acc.productionDone + b.productionDone,
      scheduled: acc.scheduled + b.scheduled,
      published: acc.published + b.published,
    }),
    { target: 0, productionDone: 0, scheduled: 0, published: 0 }
  )

  const publishedPct = totals.target > 0 ? Math.round((totals.published / totals.target) * 100) : 0

  // Insights
  const insights: { type: "warning" | "info" | "success"; message: string }[] = []
  if (totals.target > 0 && totals.published < totals.target) {
    insights.push({ type: "warning", message: `${totals.target - totals.published} more posts needed to hit target` })
  }
  if (totals.productionDone > totals.scheduled) {
    insights.push({ type: "info", message: `${totals.productionDone - totals.scheduled} items are production-ready but not yet scheduled` })
  }
  if (totals.scheduled > totals.published) {
    insights.push({ type: "info", message: `${totals.scheduled - totals.published} scheduled posts are not yet published` })
  }
  if (totals.target > 0 && totals.published >= totals.target) {
    insights.push({ type: "success", message: "Target reached! All planned posts are published." })
  }

  // Platform breakdown
  const platformMap = new Map<string, { target: number; published: number; scheduled: number; productionDone: number }>()
  buckets.forEach(b => {
    const existing = platformMap.get(b.platform) || { target: 0, published: 0, scheduled: 0, productionDone: 0 }
    platformMap.set(b.platform, {
      target: existing.target + b.target,
      published: existing.published + b.published,
      scheduled: existing.scheduled + b.scheduled,
      productionDone: existing.productionDone + b.productionDone,
    })
  })
  const platformRows = Array.from(platformMap.entries())
    .sort((a, b) => b[1].target - a[1].target)

  const monthLabel = month.charAt(0).toUpperCase() + month.slice(1)
  const clientLabel = selectedClient === "All Clients" ? "All Clients" : selectedClient

  // Cards definition
  const cards = [
    {
      label: "Target",
      value: totals.target,
      helper: "planned items",
      bg: "bg-white",
      border: "border-gray-200",
      valueColor: "text-gray-900",
      labelColor: "text-gray-500",
      dot: "bg-gray-400",
    },
    {
      label: "Production Done",
      value: totals.productionDone,
      helper: "ready to publish",
      bg: "bg-white",
      border: "border-amber-200",
      valueColor: "text-amber-600",
      labelColor: "text-amber-600",
      dot: "bg-amber-400",
    },
    {
      label: "Scheduled",
      value: totals.scheduled,
      helper: "scheduled",
      bg: "bg-white",
      border: "border-blue-200",
      valueColor: "text-blue-600",
      labelColor: "text-blue-600",
      dot: "bg-blue-500",
    },
    {
      label: "Published",
      value: totals.published,
      helper: "live posts",
      bg: "bg-white",
      border: "border-green-200",
      valueColor: "text-green-600",
      labelColor: "text-green-600",
      dot: "bg-green-500",
    },
  ]

  if (buckets.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-300 p-16 text-center">
        <p className="text-base font-semibold text-gray-600 mb-1">No monthly plan for {clientLabel} — {monthLabel}</p>
        <p className="text-sm text-gray-400">Use the Monthly Content Planner to set targets and get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{clientLabel}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{monthLabel} — Content Pipeline</p>
        </div>
        <span className={cn(
          "text-sm font-semibold px-3 py-1 rounded-full",
          publishedPct >= 100 ? "bg-green-100 text-green-700"
            : publishedPct >= 60 ? "bg-blue-100 text-blue-700"
            : publishedPct >= 30 ? "bg-amber-100 text-amber-700"
            : "bg-red-100 text-red-700"
        )}>
          {publishedPct}% complete
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className={cn("rounded-xl border p-5", card.bg, card.border)}>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0", card.dot)} />
              <span className={cn("text-xs font-semibold uppercase tracking-wide", card.labelColor)}>{card.label}</span>
            </div>
            <p className={cn("text-4xl font-bold leading-none mb-1", card.valueColor)}>{card.value}</p>
            <p className="text-xs text-gray-400">{card.helper}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">Publication Progress</span>
          <span className="text-sm font-bold text-gray-900">{totals.published} / {totals.target} published</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              publishedPct >= 100 ? "bg-green-500" : publishedPct >= 60 ? "bg-blue-500" : publishedPct >= 30 ? "bg-amber-500" : "bg-red-400"
            )}
            style={{ width: `${Math.min(publishedPct, 100)}%` }}
          />
        </div>
        {/* Stage markers */}
        <div className="flex gap-4 mt-3 flex-wrap">
          <span className="text-xs text-amber-600 font-medium">Prod Done: {totals.productionDone}</span>
          <span className="text-xs text-blue-600 font-medium">Scheduled: {totals.scheduled}</span>
          <span className="text-xs text-green-600 font-medium">Published: {totals.published}</span>
        </div>
      </div>

      {/* Insight boxes */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((ins, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 px-4 py-3 rounded-lg border text-sm font-medium",
                ins.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-800"
                  : ins.type === "success" ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              )}
            >
              <span className="mt-0.5 flex-shrink-0">
                {ins.type === "warning" ? "!" : ins.type === "success" ? "✓" : "i"}
              </span>
              {ins.message}
            </div>
          ))}
        </div>
      )}

      {/* Platform breakdown */}
      {platformRows.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Platform Breakdown</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {platformRows.map(([platform, data]) => {
              const platPct = data.target > 0 ? Math.round((data.published / data.target) * 100) : 0
              return (
                <div key={platform} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-24 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-800">{platform}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          platPct >= 100 ? "bg-green-500" : platPct >= 60 ? "bg-blue-500" : platPct >= 30 ? "bg-amber-400" : "bg-red-300"
                        )}
                        style={{ width: `${Math.min(platPct, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-500">
                    <span>Target <strong className="text-gray-800">{data.target}</strong></span>
                    <span>Published <strong className="text-green-700">{data.published}</strong></span>
                    <span className={cn(
                      "font-bold",
                      platPct >= 100 ? "text-green-600" : platPct >= 60 ? "text-blue-600" : "text-amber-600"
                    )}>{platPct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
