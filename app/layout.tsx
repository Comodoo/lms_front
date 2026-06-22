import { DemoBanner } from '@/components/shared/demo-banner'
import { AuthProvider } from '@/lib/auth-context'
import { ChatProvider } from '@/lib/chat-context'
import { LanguageProvider } from '@/lib/language-context'
import { LMSProvider } from '@/lib/lms-context'
import { NotificationsProvider } from '@/lib/notifications-context'
import { RegistrationProvider } from '@/lib/registration-context'
import { ResultsProvider } from '@/lib/results-context'
import { ThemeProvider } from '@/lib/theme-context'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Zanzibar Metropolitan College',
  description: 'Zanzibar Metropolitan College - Student Management System',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/logo.png',
      }
    ]
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <RegistrationProvider>
                <ResultsProvider>
                  <LMSProvider>
                    <NotificationsProvider>
                      <ChatProvider>
                        <DemoBanner />
                        {children}
                      </ChatProvider>
                    </NotificationsProvider>
                  </LMSProvider>
                </ResultsProvider>
              </RegistrationProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
