import type { ExternalToast } from 'vue-sonner'
import { toast } from 'vue-sonner'

export function useAppToast() {
  return {
    success: (message: string, options?: ExternalToast) => toast.success(message, options),
    error: (message: string) => toast.error(message),
  }
}
