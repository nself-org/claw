import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ɳClaw',
  description: 'nClaw AI assistant web client',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-[#0F0F1A] text-[#E4E4F0]">
        {children}
      </body>
    </html>
  )
}
