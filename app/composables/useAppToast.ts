import { toast } from 'vue-sonner'

export function useAppToast() {
  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
  }
}
