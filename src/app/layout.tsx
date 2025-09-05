import type { Metadata } from 'next'
import './globals.css'
import { Header } from '../components/Header'
import { ToastProvider } from '../components/ui/Toast'

export const metadata: Metadata = {
  title: 'Excel Explorer',
  description: 'Upload, explore, and visualize your Excel data',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <ToastProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}
