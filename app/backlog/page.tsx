"use client"

import { AuthGuard } from "@/components/auth-guard"
import { TopNav } from "@/components/top-nav"
import { Sidebar } from "@/components/sidebar"
import { BreadcrumbTrail } from "@/components/breadcrumb-trail"
import { BacklogDashboard } from "@/components/backlog-dashboard"

export default function BacklogPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FAFBFC]">
        <TopNav />
        <div className="flex">
          <Sidebar currentPhase="backlog" onPhaseChange={() => {}} />
          <main className="flex-1 ml-64 mt-16 p-8 [@media(max-width:768px)]:ml-20">
            <div className="max-w-7xl mx-auto">
              <BreadcrumbTrail
                items={[
                  { label: "Home", onClick: () => window.location.href = "/" },
                  { label: "Backlog", active: true },
                ]}
              />
              <BacklogDashboard />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
