"use client"

import { useState, useEffect } from "react"
import { Share2, ExternalLink, Calendar, MessageSquare, FileText, BarChart3, ChevronDown } from "lucide-react"
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

interface Week {
  week: number
  start: Date
  end: Date
  label: string
}

interface Task {
  id: string
  title: string
  status: "todo" | "in_progress" | "in_review" | "done"
  due_date?: string
  assigned_user_name?: string
}

export default function ClientPage({ params }: ClientPageProps) {
  const clientId = params.clientId
  const [shareUrl, setShareUrl] = useState("")
  const [clientName, setClientName] = useState("")
  const [selectedMonth, setSelectedMonth] = useState<string>("")
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [weeks, setWeeks] = useState<Week[]>([])

  // Fetch client details
  const { data: clientData } = useSWR(`/api/clients/${clientId}`, fetcher)
  
  // Fetch tasks for this client
  const { data: tasksData } = useSWR(`/api/tasks?client_id=${clientId}`, fetcher)
  
  // Fetch content records for this client
  const { data: contentData } = useSWR(`/api/content/records?client_id=${clientId}`, fetcher)
  
  // Fetch meetings for this client
  const { data: meetingsData } = useSWR(`/api/meetings?client_id=${clientId}`, fetcher)

  // Initialize month and generate weeks on mount
  useEffect(() => {
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setSelectedMonth(monthStr)
    generateWeeksForMonth(now.getFullYear(), now.getMonth() + 1)
    setSelectedWeek(getCurrentWeek(now.getFullYear(), now.getMonth() + 1))
  }, [])

  const generateWeeksForMonth = (year: number, month: number) => {
    const weeks: Week[] = []
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    
    let currentDate = new Date(firstDay)
    // Find the Monday of the first week
    const dayOfWeek = currentDate.getDay()
    const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    currentDate = new Date(currentDate.setDate(diff))

    let weekNumber = 1
    while (currentDate <= lastDay) {
      const weekStart = new Date(currentDate)
      const weekEnd = new Date(currentDate)
      weekEnd.setDate(weekEnd.getDate() + 5) // Monday to Saturday

      // Only include weeks that have days in this month
      if (weekStart <= lastDay && weekEnd >= firstDay) {
        const label = `Week ${weekNumber} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
        weeks.push({
          week: weekNumber,
          start: new Date(weekStart),
          end: new Date(weekEnd),
          label,
        })
        weekNumber++
      }
      currentDate.setDate(currentDate.getDate() + 7)
    }
    setWeeks(weeks)
  }

  const getCurrentWeek = (year: number, month: number): number => {
    const now = new Date()
    const firstDay = new Date(year, month - 1, 1)
    
    let currentDate = new Date(firstDay)
    const dayOfWeek = currentDate.getDay()
    const diff = currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    currentDate = new Date(currentDate.setDate(diff))

    let weekNumber = 1
    while (currentDate <= now) {
      const weekEnd = new Date(currentDate)
      weekEnd.setDate(weekEnd.getDate() + 5)
      
      if (now >= currentDate && now <= weekEnd) {
        return weekNumber
      }
      currentDate.setDate(currentDate.getDate() + 7)
      weekNumber++
    }
    return 1
  }

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth)
    const [year, month] = newMonth.split('-').map(Number)
    generateWeeksForMonth(year, month)
    setSelectedWeek(1)
  }

  useEffect(() => {
    if (clientData?.name) {
      setClientName(clientData.name)
    }
    setShareUrl(`${window.location.origin}/client/${clientId}`)
  }, [clientData, clientId])

  const tasks = tasksData?.tasks || []
  const contentRecords = contentData?.records || []
  const meetings = meetingsData?.meetings || []

  // Filter tasks by selected week
  const filteredTasks = selectedWeek && weeks.length > 0 
    ? tasks.filter(task => {
        if (!task.due_date) return false
        const dueDate = new Date(task.due_date)
        const week = weeks[selectedWeek - 1]
        return dueDate >= week.start && dueDate <= week.end
      })
    : tasks

  // Calculate metrics
  const completedTasks = filteredTasks.filter(t => t.status === "done").length
  const completionRate = filteredTasks.length > 0 ? Math.round((completedTasks / filteredTasks.length) * 100) : 0
  const publishedContent = contentRecords.filter(c => c.status === "published").length
  const scheduledContent = contentRecords.filter(c => c.status === "scheduled").length

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(new Date().getFullYear(), i, 1)
    return {
      value: `${date.getFullYear()}-${String(i + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <ClientHeader 
        clientName={clientName} 
        shareUrl={shareUrl}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Month and Week Filters */}
        <div className="mb-8 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Filter by Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Month Dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Week Dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">Week</label>
              <select
                value={selectedWeek || 1}
                onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {weeks.map(week => (
                  <option key={week.week} value={week.week}>
                    {week.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <ClientDashboardCards
          totalTasks={filteredTasks.length}
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
            <p className="text-sm text-slate-600 mt-1">
              {selectedWeek && weeks.length > 0 
                ? `Tasks for ${weeks[selectedWeek - 1].label}`
                : 'All tasks assigned to your project across the team'}
            </p>
          </div>
          <ClientTasksTable tasks={filteredTasks} />
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
