import type { Metadata } from 'next'
import './globals.css'
import { AdminShell } from './AdminShell'

export const metadata: Metadata = {
  title: 'Lunari Admin',
  description: 'Lunari internal admin dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  )
}
