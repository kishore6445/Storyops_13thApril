"use client"

import { AuthGuard } from "@/components/auth-guard"
import { TopNav } from "@/components/top-nav"
import { Sidebar } from "@/components/sidebar"
import { useState } from "react"

export default function MeetingsLayout({ children }: { children: React.ReactNode }) {
  const [currentPhase, setCurrentPhase] = useState("meetings")

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#FAFBFC]">
        <TopNav />
        <div className="flex">
          <Sidebar currentPhase={currentPhase} onPhaseChange={setCurrentPhase} />
          <main className="flex-1 ml-64 mt-16 transition-all duration-300 [@media(max-width:768px)]:ml-20">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
