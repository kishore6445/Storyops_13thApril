"use client"

import { AuthGuard } from "@/components/auth-guard"
import { TopNav } from "@/components/top-nav"
import { Sidebar } from "@/components/sidebar"
import { TeamAnalyticsDashboard } from "@/components/team-analytics-dashboard"

export default function TeamAnalyticsPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar currentPhase="team-analytics" onPhaseChange={() => {}} />
        <div className="flex-1 flex flex-col">
          <TopNav />
          <main className="flex-1 overflow-auto bg-white">
            <div className="max-w-7xl mx-auto">
              <TeamAnalyticsDashboard />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
