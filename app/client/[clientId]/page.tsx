"use client"

import { useState, useEffect } from "react"
import { Share2, ExternalLink, Calendar, MessageSquare, FileText, BarChart3 } from "lucide-react"
import useSWR from "swr"
import { ClientHeader } from "@/components/client-header"
import { ClientDashboardCards } from "@/components/client-dashboard-cards"
import { ClientTasksTable } from "@/components/client-tasks-table"
import { ClientMeetingsSection } from "@/components/client-meetings-section"
import { ClientContentStatus } from "@/components/client-content-status"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ClientPageProps {
  params: {
    clientId: string
  }
}

export default function ClientPage({ params }: ClientPageProps) {
  const clientId = params.clientId
  const [shareUrl, setShareUrl] = useState("")
  const [clientName, setClientName] = useState("")

  // Fetch client details
  const { data: clientData } = useSWR(`/api/clients/${clientId}`, fetcher)
  
  // Fetch tasks for this client
  const { data: tasksData } = useSWR(`/api/tasks?client_id=${clientId}`, fetcher)
  
  // Fetch content records for this client
  const { data: contentData } = useSWR(`/api/content/records?client_id=${clientId}`, fetcher)
  
  // Fetch meetings for this client
  const { data: meetingsData } = useSWR(`/api/meetings?client_id=${clientId}`, fetcher)

  useEffect(() => {
    if (clientData?.name) {
      setClientName(clientData.name)
    }
    setShareUrl(`${window.location.origin}/client/${clientId}`)
  }, [clientData, clientId])

  const tasks = tasksData?.tasks || []
  const contentRecords = contentData?.records || []
  const meetings = meetingsData?.meetings || []

  // Calculate metrics
  const completedTasks = tasks.filter(t => t.status === "done").length
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
  const publishedContent = contentRecords.filter(c => c.status === "published").length
  const scheduledContent = contentRecords.filter(c => c.status === "scheduled").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <ClientHeader 
        clientName={clientName} 
        shareUrl={shareUrl}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard Cards */}
        <ClientDashboardCards
          totalTasks={tasks.length}
          completedTasks={completedTasks}
          completionRate={completionRate}
          meetingCount={meetings.length}
          publishedContent={publishedContent}
          scheduledContent={scheduledContent}
        />

        {/* Tasks Section */}
        <div className="mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Project Tasks</h2>
            <p className="text-sm text-slate-600 mt-1">All tasks assigned to your project across the team</p>
          </div>
          <ClientTasksTable tasks={tasks} />
        </div>

        {/* Meetings Section */}
        <div className="mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Meetings & MOMs</h2>
            <p className="text-sm text-slate-600 mt-1">Meeting notes and recordings</p>
          </div>
          <ClientMeetingsSection meetings={meetings} />
        </div>

        {/* Content Status Section */}
        <div className="mt-8 pb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Content Status</h2>
            <p className="text-sm text-slate-600 mt-1">Content publishing status by platform</p>
          </div>
          <ClientContentStatus contentRecords={contentRecords} />
        </div>
      </div>
    </div>
  )
}
