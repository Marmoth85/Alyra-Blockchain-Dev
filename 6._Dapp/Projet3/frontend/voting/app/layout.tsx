import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Layout from '@/components/layout/Layout'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

import { headers } from 'next/headers' // added
import ContextProvider from '@/context'

export const metadata: Metadata = {
  title: 'VotingDApp',
  description: 'Décentralised voting on Ethereum',
  icons: { icon: '/icon.svg' },
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersObj = await headers()
  const cookies = headersObj.get('cookie')

  return (
    <html lang="fr" className="dark">
      <body className={inter.className}>
        <ContextProvider cookies={cookies}>
          <Layout>
            {children}
          </Layout>
          <Toaster richColors position="bottom-right" />
        </ContextProvider>
      </body>
    </html>
  )
}