"use client"

import { AuthGuard } from "@/components/auth-guard"
import { TopNav } from "@/components/top-nav"
import { Sidebar } from "@/components/sidebar"
import { BreadcrumbTrail } from "@/components/breadcrumb-trail"
import { ClientOverview } from "@/components/client-overview"

export default function SprintManagementPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-white ml-[256px]">
        <Sidebar currentPhase="sprint-management" onPhaseChange={() => { }} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-hidden">
            <div className="h-full p-6">
              <BreadcrumbTrail
                items={[
                  { label: "Home", onClick: () => window.location.href = "/" },
                  { label: "Sprint Management", active: true },
                ]}
              />
              <div className="mt-4 h-[calc(100%-3rem)] overflow-hidden">
                <ClientOverview />
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
