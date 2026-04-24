import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const sprintId = searchParams.get('sprintId')

    const supabase = getSupabaseClient()

    // Query sprint_tasks table
    let sprintTasksQuery = supabase
      .from('sprint_tasks')
      .select('id, status, created_at, assigned_to')
    
    if (clientId && clientId !== 'all') {
      sprintTasksQuery = sprintTasksQuery.eq('client_id', clientId)
    }
    if (sprintId && sprintId !== 'all') {
      sprintTasksQuery = sprintTasksQuery.eq('sprint_id', sprintId)
    }

    // Query tasks table (tasks created via My Tasks that are assigned to a sprint)
    let regularTasksQuery = supabase
      .from('tasks')
      .select('id, status, created_at, assigned_to')
      .not('sprint_id', 'is', null)

    if (clientId && clientId !== 'all') {
      regularTasksQuery = regularTasksQuery.eq('client_id', clientId)
    }
    if (sprintId && sprintId !== 'all') {
      regularTasksQuery = regularTasksQuery.eq('sprint_id', sprintId)
    }

    const [sprintTasksResult, regularTasksResult] = await Promise.all([
      sprintTasksQuery,
      regularTasksQuery,
    ])

    if (sprintTasksResult.error) {
      console.error('[v0] Error fetching sprint_tasks for stats:', sprintTasksResult.error)
    }
    if (regularTasksResult.error) {
      console.error('[v0] Error fetching tasks for stats:', regularTasksResult.error)
    }

    const tasks = [
      ...(sprintTasksResult.data || []),
      ...(regularTasksResult.data || []),
    ]

    // Calculate all stats from the data
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'done').length
    const todoCount = tasks.filter(t => t.status === 'to-do' || t.status === 'todo').length
    const inProgressCount = tasks.filter(t => t.status === 'in-progress' || t.status === 'in_progress').length
    const inReviewCount = tasks.filter(t => t.status === 'in-review' || t.status === 'in_review').length
    const doneCount = tasks.filter(t => t.status === 'done').length
    const atRiskTasks = tasks.filter(t => t.status === 'blocked').length
    
    // Calculate completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Get team size (unique assigned users)
    const uniqueTeamMembers = new Set(tasks.map(t => t.assigned_to).filter(Boolean))
    const teamSize = uniqueTeamMembers.size

    // Calculate weekly velocity (tasks completed in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const weeklyVelocity = tasks.filter(t => 
      t.status === 'done' && 
      t.created_at && 
      new Date(t.created_at) >= sevenDaysAgo
    ).length

    console.log('[v0] Stats calculated:', {
      totalTasks,
      completedTasks,
      todoCount,
      inProgressCount,
      inReviewCount,
      doneCount,
      completionRate,
      teamSize,
      atRiskTasks,
      weeklyVelocity
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalTasks,
        completedTasks,
        completionRate,
        teamSize,
        atRiskTasks,
        todoCount,
        inProgressCount,
        inReviewCount,
        doneCount,
        weeklyVelocity
      }
    })
  } catch (error) {
    console.error('[v0] Error in GET /api/account-manager/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
