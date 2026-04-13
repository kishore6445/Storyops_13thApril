"use client"

import { TeamAnalyticsDashboard } from "@/components/team-analytics-dashboard"
import { BreadcrumbTrail } from "@/components/breadcrumb-trail"

export default function TeamAnalyticsPage() {
  return (
    <main className="h-full bg-white">
      <BreadcrumbTrail
        items={[
          { label: "Home", onClick: () => window.location.href = "/" },
          { label: "Team Analytics", active: true },
        ]}
      />
      <TeamAnalyticsDashboard />
    </main>
  )
}
