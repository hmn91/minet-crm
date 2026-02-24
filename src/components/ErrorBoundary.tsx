import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle size={48} className="text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Đã xảy ra lỗi</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            {this.state.error?.message ?? 'Lỗi không xác định'}
          </p>
          <Button onClick={() => window.location.reload()}>Tải lại trang</Button>
        </div>
      )
    }
    return this.props.children
  }
}
