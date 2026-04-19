"use client"

import { AuthGuard } from "@/components/auth-guard"
import { TopNav } from "@/components/top-nav"
import { Sidebar } from "@/components/sidebar"
import { BreadcrumbTrail } from "@/components/breadcrumb-trail"
import { SprintManagementDashboard } from "@/components/sprint-management-dashboard"

export default function SprintManagementPage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <TopNav />
          <main className="flex-1 overflow-auto bg-white">
            <div className="max-w-7xl mx-auto p-6">
              <BreadcrumbTrail
                items={[
                  { label: "Home", onClick: () => window.location.href = "/" },
                  { label: "Sprint Management", active: true },
                ]}
              />
              <SprintManagementDashboard />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
