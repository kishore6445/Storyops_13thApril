"use client"

import { CheckCircle2, AlertCircle, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClientDetailHeroProps {
  clientName: string
  totalTarget: number
  totalAchieved: number
  performancePercent: number
  daysLeftInMonth?: number
  topPerformer?: {
    title: string
    platform: string
    reach: number
    engagement: number
    engagementRate: number
  }
  needsImprovement?: {
    title: string
    platform: string
    reach: number
    engagement: number
    engagementRate: number
  }
  totalReach: number
  status: "on-track" | "at-risk" | "critical"
}

export function ClientDetailHero({
  clientName,
  totalTarget,
  totalAchieved,
  performancePercent,
  daysLeftInMonth = 7,
  topPerformer,
  needsImprovement,
  totalReach,
  status,
}: ClientDetailHeroProps) {
  let statusLabel = "On Track"
  let statusColor = "text-green-600"
  let statusBg = "bg-green-50"
  let statusDot = "bg-green-500"
  let statusBorder = "border-green-200"

  if (status === "at-risk") {
    statusLabel = "At Risk"
    statusColor = "text-red-600"
    statusBg = "bg-red-50"
    statusDot = "bg-red-500"
    statusBorder = "border-red-200"
  } else if (status === "critical") {
    statusLabel = "Critical"
    statusColor = "text-red-700"
    statusBg = "bg-red-100"
    statusDot = "bg-red-600"
    statusBorder = "border-red-300"
  }

  const gap = totalTarget - totalAchieved

  return (
    <div className={cn("rounded-lg border-2 p-8 space-y-6", statusBg, statusBorder)}>
      {/* Header with Status */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">{clientName}</h2>
          <p className="text-sm text-gray-600">
            {totalAchieved} of {totalTarget} posts published in April
          </p>
        </div>

        <div
          className={cn(
            "px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 whitespace-nowrap",
            statusBg,
            statusColor
          )}
        >
          <span className={cn("w-2.5 h-2.5 rounded-full", statusDot)} />
          {statusLabel}
        </div>
      </div>

      {/* Performance Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-medium text-gray-700">Publication Progress</span>
          <span className="text-2xl font-bold text-gray-900">{performancePercent}%</span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-4">
          <div
            className={cn(
              "h-4 rounded-full transition-all",
              performancePercent >= 70 ? "bg-green-500" : performancePercent >= 40 ? "bg-amber-500" : "bg-red-500"
            )}
            style={{ width: `${Math.min(performancePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Key Info Grid */}
      <div className="grid grid-cols-3 gap-4 pb-6 border-b border-gray-300">
        <div className="space-y-1">
          <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">REMAINING</p>
          <p className="text-2xl font-bold text-gray-900">{gap}</p>
          <p className="text-xs text-gray-500">posts to target</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">DAYS LEFT</p>
          <p className="text-2xl font-bold text-gray-900">~{daysLeftInMonth}</p>
          <p className="text-xs text-gray-500">in April</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">TOTAL REACH</p>
          <p className="text-2xl font-bold text-blue-600">{(totalReach / 1000).toFixed(1)}k</p>
          <p className="text-xs text-gray-500">all posts</p>
        </div>
      </div>

      {/* Top Performers Highlight */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Best Performer */}
        {topPerformer && (
          <div className="bg-white border border-green-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Top Performer</p>
            </div>
            <p className="font-semibold text-gray-900 text-sm">{topPerformer.title}</p>
            <p className="text-xs text-gray-600 mb-3">{topPerformer.platform}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-500">Reach</p>
                <p className="font-bold text-gray-900">{topPerformer.reach.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Engagement</p>
                <p className="font-bold text-green-600">{topPerformer.engagementRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Needs Improvement */}
        {needsImprovement && (
          <div className="bg-white border border-amber-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Needs Improvement</p>
            </div>
            <p className="font-semibold text-gray-900 text-sm">{needsImprovement.title}</p>
            <p className="text-xs text-gray-600 mb-3">{needsImprovement.platform}</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-500">Reach</p>
                <p className="font-bold text-gray-900">{needsImprovement.reach.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Engagement</p>
                <p className="font-bold text-amber-600">{needsImprovement.engagementRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommended Action */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500" />
        <div>
          <p className="text-sm font-semibold text-blue-900">Recommended Action</p>
          <p className="text-sm text-blue-700 mt-1">
            {gap > 0
              ? `Publish ${gap} more post${gap !== 1 ? "s" : ""} in the next ${daysLeftInMonth} days to hit your target of ${totalTarget}`
              : "Target achieved! Continue monitoring engagement rates and focus on content optimization"}
          </p>
        </div>
      </div>
    </div>
  )
}
