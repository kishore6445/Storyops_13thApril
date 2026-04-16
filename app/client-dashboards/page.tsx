"use client"

import { useState, useEffect } from "react"
import { Search, Briefcase, ArrowRight, AlertCircle, Loader } from "lucide-react"
import Link from "next/link"

interface Client {
  id: string
  name: string
  email?: string
  industry?: string
  status?: string
}

export default function ClientDashboardsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const token = typeof window !== "undefined" ? localStorage.getItem("sessionToken") : null
        console.log("[v0] Fetching clients with token:", !!token)
        
        const response = await fetch("/api/clients", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        console.log("[v0] Clients API response status:", response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error("[v0] API error response:", errorText)
          throw new Error(`Failed to fetch clients: ${response.status}`)
        }

        const data = await response.json()
        console.log("[v0] Clients fetched successfully:", data)
        setClients(Array.isArray(data) ? data : data.clients || [])
      } catch (err) {
        console.error("[v0] Error fetching clients:", err)
        setError(err instanceof Error ? err.message : "Failed to load clients")
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [])

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="w-full max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Client Dashboards</h1>
        <p className="text-gray-600">Select a client to view their project dashboard and task status</p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-red-700 font-medium">Error loading clients</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-16">
          <Loader className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 text-lg font-medium">Loading clients...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your clients</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && clients.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">No clients found</p>
          <p className="text-gray-500 text-sm mt-2">You don&apos;t have any clients yet</p>
        </div>
      )}

      {/* Empty Search Results */}
      {!isLoading && !error && clients.length > 0 && filteredClients.length === 0 && (
        <div className="text-center py-16 bg-gray-50 rounded-lg border border-gray-200">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">No clients match your search</p>
          <p className="text-gray-500 text-sm mt-2">Try a different search term</p>
        </div>
      )}

      {/* Clients Grid */}
      {!isLoading && filteredClients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Link
              key={client.id}
              href={`/client/${client.id}`}
              className="group bg-white rounded-lg shadow hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">{client.name}</h3>
                {client.email && <p className="text-sm text-gray-600 mb-3">{client.email}</p>}

                <div className="flex flex-wrap gap-2">
                  {client.industry && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {client.industry}
                    </span>
                  )}
                  {client.status && (
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium ${
                        client.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {client.status}
                    </span>
                  )}
                </div>
              </div>

              <div className="px-6 py-3 bg-gray-50 group-hover:bg-blue-50 transition-colors flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">View Dashboard</span>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
