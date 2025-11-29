// app/layout.tsx
'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { usePathname } from 'next/navigation'
import { queryClient } from '@/lib/queryClient'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import Navbar from '@/components/Navbar/Navbar'
import Header from '@/components/Header'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { loading } = useCurrentUser()
  const isAuthPage = pathname?.startsWith('/auth')

  // Hiện loading khi chưa mount (tránh hydration)
  if (loading && !isAuthPage) {
    return (
      <html lang="en">
        <body>
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <Navbar />
          <Header />
          <main>
            {children}
          </main>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  )
}