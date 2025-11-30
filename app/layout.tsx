// app/layout.tsx
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { usePathname } from 'next/navigation'
import { queryClient } from '@/lib/queryClient'
import ThemeProvider from '@/components/ThemeProvider'
import Navbar from '@/components/Navbar/Navbar'
import Header from '@/components/Header'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth')

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            {!isAuthPage && (
              <>
                <Navbar />
                <Header />
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