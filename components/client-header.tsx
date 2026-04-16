import { Share2, Copy, Check, ExternalLink } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

interface ClientHeaderProps {
  clientName: string
  shareUrl: string
  clientId: string
}

export function ClientHeader({ clientName, shareUrl, clientId }: ClientHeaderProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{clientName || "Client Project"}</h1>
            <p className="text-sm text-slate-600 mt-1">Project overview and status tracking</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href={`/client-report/${clientId}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              View Report
            </Link>
            
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  Share Link
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
