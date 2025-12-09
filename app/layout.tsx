// app/layout.tsx - WITH FEED TYPE STATE
'use client'

import { useState, useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { usePathname } from 'next/navigation'
import { queryClient } from '@/lib/queryClient'
import ThemeProvider from '@/components/ThemeProvider'
import Navbar from '@/components/Navbar/Navbar'
import Header from '@/components/Header'
import type { FeedType } from '@/components/Header'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth')
  const [feedType, setFeedType] = useState<FeedType>('for-you')

  // Listen to feedType changes from Home page
  useEffect(() => {
    const handleFeedTypeChange = (e: any) => {
      if (e.detail) {
        setFeedType(e.detail)
      }
    }
    
    window.addEventListener('feedTypeChange', handleFeedTypeChange)
    return () => window.removeEventListener('feedTypeChange', handleFeedTypeChange)
  }, [])

  const handleFeedTypeChange = (type: FeedType) => {
    setFeedType(type)
    // Dispatch event to Home page
    const event = new CustomEvent('headerFeedTypeChange', { detail: type })
    window.dispatchEvent(event)
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            {!isAuthPage && (
              <>
                <Navbar />
                <Header 
                  feedType={feedType}
                  onFeedTypeChange={handleFeedTypeChange}
                />
              </>
            )}
            <main style={isAuthPage ? { marginLeft: 0 } : undefined}>
              {children}
            </main>
            <ReactQueryDevtools initialIsOpen={false} />
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}