"use client"

import { CheckCircle2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

type Stage = {
  label: string
  date?: string
  isComplete: boolean
  isActive: boolean
}

interface ProductionFlowTimelineProps {
  postTitle: string
  stages: Stage[]
  currentStatus: string
}

export function ProductionFlowTimeline({ postTitle, stages, currentStatus }: ProductionFlowTimelineProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="font-semibold text-gray-900 mb-4">{postTitle}</h3>

      {/* Timeline */}
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div key={index} className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex flex-col items-center">
              {stage.isComplete ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : stage.isActive ? (
                <Clock className="w-6 h-6 text-blue-600 animate-pulse" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
              )}

              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div
                  className={cn(
                    "w-1 h-12 my-2",
                    stage.isComplete ? "bg-green-600" : "bg-gray-200"
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <p className={cn("font-medium", stage.isComplete ? "text-gray-900" : stage.isActive ? "text-blue-900" : "text-gray-500")}>
                {stage.label}
              </p>
              {stage.date && (
                <p className="text-sm text-gray-500 mt-1">{stage.date}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Current Status Badge */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <span className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-sm font-medium text-blue-700">
          Currently: {currentStatus}
        </span>
      </div>
    </div>
  )
}
