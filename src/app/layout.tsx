export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/context/LanguageContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Fresh-Rider | Premium Helmet Hygiene',
    description: 'Fresh-Rider Yüksek Teknoloji Kask Dezenfektan Yönetim Paneli',
    manifest: '/manifest.json',
    themeColor: '#0f172a',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Fresh-Rider',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="tr">
            <head>
                <link rel="apple-touch-icon" href="/icon-192x192.png" />
            </head>
            <body className={inter.className}>
                <LanguageProvider>
                    {children}
                </LanguageProvider>
            </body>
        </html>
    )
}
