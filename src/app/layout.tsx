import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/Header'
import { ToastProvider } from '@/components/ui/Toast'
import { OpenRouterProvider } from '@/hooks/useOpenRouter'
import React from 'react'

export const metadata: Metadata = {
  title: 'Excel Explorer',
  description: 'Upload, explore, and visualize your Excel data',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50" suppressHydrationWarning>
        <ToastProvider>
          <OpenRouterProvider>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <main className="w-full max-w-none px-2 py-3 xl:px-4 min-h-screen text-gray-900">
                {children}
              </main>
            </div>
          </OpenRouterProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
