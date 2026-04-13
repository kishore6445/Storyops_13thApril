"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottleneckInsight {
  type: "shortfall" | "production_lag" | "scheduling_lag" | "publishing_lag"
  message: string
  count?: number
  severity: "low" | "medium" | "high"
}

interface PlatformMetric {
  name: string
  achieved: number
  target: number
}

interface ContentVisibilityHeroProps {
  target: number
  published: number
  scheduled: number
  productionDone: number
  insights: BottleneckInsight[]
  platformMetrics?: PlatformMetric[]
  clientName?: string
  isAllClients?: boolean
}

export function ContentVisibilityHero({
  target,
  published,
  scheduled,
  productionDone,
  insights,
  platformMetrics = [],
  clientName = "All Clients",
  isAllClients = false,
}: ContentVisibilityHeroProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const progress = target > 0 ? (published / target) * 100 : 0
  const gap = target - published

  let statusLabel = "On Track"
  let statusColor = "text-green-600"
  let statusBg = "bg-green-50"
  let statusDot = "bg-green-500"
  let statusBorder = "border-green-200"

  if (progress < 40) {
    statusLabel = "Critical"
    statusColor = "text-red-600"
    statusBg = "bg-red-50"
    statusDot = "bg-red-500"
    statusBorder = "border-red-200"
  } else if (progress < 70) {
    statusLabel = "At Risk"
    statusColor = "text-amber-600"
    statusBg = "bg-amber-50"
    statusDot = "bg-amber-500"
    statusBorder = "border-amber-200"
  }

  const getProgressColor = (achieved: number, target: number) => {
    const percentage = target > 0 ? (achieved / target) * 100 : 0
    if (percentage >= 70) return "bg-green-600"
    if (percentage >= 40) return "bg-amber-600"
    return "bg-red-600"
  }

  const primaryBottleneck = insights.length > 0 ? insights[0] : null

  const getRecommendedAction = () => {
    if (gap === 0) {
      return "On pace! Continue monitoring scheduled posts for timely publication."
    } else if (gap === 1) {
      return `Publish 1 more post to hit your target of ${target}.`
    } else if (gap <= 5) {
      return `Publish the next ${gap} scheduled posts to reach ${target} total.`
    } else {
      return `You need ${gap} more posts. Start reviewing and publishing from your queue.`
    }
  }

  return (
    <div className="space-y-4">
      {/* MAIN HERO - Simplified and Dominant */}
      <div
        className={cn(
          "bg-white rounded-xl border-2 p-10 transition-all hover:shadow-lg",
          statusBorder
        )}
      >
        {/* Header Row */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-2 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
            <span className="text-sm text-gray-500">{clientName}</span>
          </button>

          <div
            className={cn(
              "px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2",
              statusBg,
              statusColor
            )}
          >
            <span className={cn("w-2.5 h-2.5 rounded-full", statusDot)} />
            {statusLabel}
          </div>
        </div>

        {/* FOUR BIG METRICS GRID */}
        <div className="mb-10">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-6">
            Publishing Status Overview
          </p>

          {/* 4 Column Grid - All Large Numbers */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {/* Target */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center">
              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-3">Target</p>
              <p className="text-6xl font-black text-gray-900">{target}</p>
              <p className="text-xs text-gray-500 mt-2">planned posts</p>
            </div>

            {/* Published */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200 text-center">
              <p className="text-xs text-green-600 font-semibold uppercase tracking-wide mb-3">Published</p>
              <p className="text-6xl font-black text-green-600">{published}</p>
              <p className="text-xs text-green-600 mt-2">live posts</p>
            </div>

            {/* Production Done */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 text-center">
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-3">Production Done</p>
              <p className="text-6xl font-black text-blue-600">{productionDone}</p>
              <p className="text-xs text-blue-600 mt-2">ready for publishing</p>
            </div>

            {/* Scheduled */}
            <div className="bg-amber-50 rounded-lg p-6 border border-amber-200 text-center">
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide mb-3">Scheduled</p>
              <p className="text-6xl font-black text-amber-600">{scheduled}</p>
              <p className="text-xs text-amber-600 mt-2">ready to publish</p>
            </div>
          </div>

          {/* Progress Bar - Visual Confirmation */}
          <div className="space-y-3">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={cn("h-3 rounded-full transition-all", getProgressColor(published, target))}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center px-1">
              <span className={cn("text-lg font-bold", statusColor)}>
                {Math.round(progress)}% complete
              </span>
              {gap > 0 && (
                <span className="text-sm font-semibold text-red-600">
                  {gap} {gap === 1 ? "post" : "posts"} to go
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SEPARATOR */}
        <div className="border-t border-gray-200 my-8" />

        {/* CRITICAL INFO SECTION */}
        {primaryBottleneck && (
          <div
            className={cn(
              "rounded-lg p-4 flex items-start gap-3 mb-6",
              primaryBottleneck.severity === "high"
                ? "bg-red-50 border border-red-200"
                : "bg-amber-50 border border-amber-200"
            )}
          >
            {primaryBottleneck.type === "shortfall" ? (
              <AlertCircle
                className={cn(
                  "w-5 h-5 flex-shrink-0 mt-0.5",
                  primaryBottleneck.severity === "high" ? "text-red-500" : "text-amber-500"
                )}
              />
            ) : (
              <Clock
                className={cn(
                  "w-5 h-5 flex-shrink-0 mt-0.5",
                  primaryBottleneck.severity === "high" ? "text-red-500" : "text-amber-500"
                )}
              />
            )}
            <div className="flex-1">
              <p
                className={cn(
                  "text-sm font-semibold",
                  primaryBottleneck.severity === "high" ? "text-red-700" : "text-amber-700"
                )}
              >
                {primaryBottleneck.message}
              </p>
            </div>
          </div>
        )}

        {/* RECOMMENDED ACTION - Call to Action */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900">Next Step</p>
            <p className="text-sm text-blue-700 mt-1">{getRecommendedAction()}</p>
          </div>
        </div>
      </div>

      {/* Expanded Detailed View */}
      {isExpanded && (
        <div className="space-y-4">
          {/* All Insights */}
          {insights.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                All Bottlenecks
              </h4>
              <div className="space-y-3">
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-lg border p-4 flex items-start gap-3",
                      insight.severity === "high"
                        ? "bg-red-50 border-red-200"
                        : insight.severity === "medium"
                          ? "bg-amber-50 border-amber-200"
                          : "bg-blue-50 border-blue-200"
                    )}
                  >
                    {insight.type === "shortfall" ? (
                      <AlertCircle
                        className={cn(
                          "w-5 h-5 flex-shrink-0 mt-0.5",
                          insight.severity === "high"
                            ? "text-red-500"
                            : insight.severity === "medium"
                              ? "text-amber-500"
                              : "text-blue-500"
                        )}
                      />
                    ) : (
                      <Clock
                        className={cn(
                          "w-5 h-5 flex-shrink-0 mt-0.5",
                          insight.severity === "high"
                            ? "text-red-500"
                            : insight.severity === "medium"
                              ? "text-amber-500"
                              : "text-blue-500"
                        )}
                      />
                    )}
                    <div className="flex-1">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          insight.severity === "high"
                            ? "text-red-700"
                            : insight.severity === "medium"
                              ? "text-amber-700"
                              : "text-blue-700"
                        )}
                      >
                        {insight.message}
                      </p>
                      {insight.count !== undefined && (
                        <p
                          className={cn(
                            "text-xs mt-1",
                            insight.severity === "high"
                              ? "text-red-600"
                              : insight.severity === "medium"
                                ? "text-amber-600"
                                : "text-blue-600"
                          )}
                        >
                          Count: {insight.count}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Breakdown */}
          {platformMetrics && platformMetrics.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                Platform Breakdown
              </h4>
              <div className="space-y-4">
                {platformMetrics.map((platform) => {
                  const platformProgress =
                    platform.target > 0
                      ? (platform.achieved / platform.target) * 100
                      : 0
                  const platformColor = getProgressColor(
                    platform.achieved,
                    platform.target
                  )

                  return (
                    <div key={platform.name}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {platform.name}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {platform.achieved}/{platform.target}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={cn("h-2 rounded-full", platformColor)}
                          style={{
                            width: `${Math.min(platformProgress, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
