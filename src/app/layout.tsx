import type { Metadata } from 'next'
import './globals.css'
import { Header } from '../components/Header'
import { ToastProvider } from '../components/ui/Toast'
import { OpenRouterProvider } from '../hooks/useOpenRouter'

export const metadata: Metadata = {
  title: 'Excel Explorer',
  description: 'Upload, explore, and visualize your Excel data',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50" suppressHydrationWarning>
        <ToastProvider>
          <OpenRouterProvider>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <main className="w-full max-w-none px-2 py-3 xl:px-4 min-h-screen">{children}</main>
            </div>
          </OpenRouterProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
