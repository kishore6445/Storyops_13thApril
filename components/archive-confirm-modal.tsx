import { AlertCircle, Archive, X } from "lucide-react"

interface ArchiveConfirmModalProps {
  isOpen: boolean
  taskTitle: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function ArchiveConfirmModal({
  isOpen,
  taskTitle,
  onConfirm,
  onCancel,
  isLoading = false,
}: ArchiveConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Archive Task</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-700 mb-4">
            Are you sure you want to archive this task?
          </p>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-900 truncate">{taskTitle}</p>
            <p className="text-xs text-gray-500 mt-1">This task will be moved to the Archive section</p>
          </div>
          <p className="text-xs text-gray-600 mt-4">
            You can restore it from the Archive folder at any time.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Archive className="w-4 h-4" />
            {isLoading ? "Archiving..." : "Archive Task"}
          </button>
        </div>
      </div>
    </div>
  )
}
