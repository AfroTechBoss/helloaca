import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Limelight } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'
import './globals.css'

const limelight = Limelight({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-limelight',
})

export const metadata: Metadata = {
  title: 'helloaca - Hello AI Contract Analyzer',
  description: 'Intelligent contract analysis and risk assessment platform',
  generator: 'helloaca',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script id="Cookiebot" src="https://consent.cookiebot.com/uc.js" data-cbid="216189d0-8334-4efc-87ed-03ade99591b3" type="text/javascript" async></script>
        
        {/* Google Consent Mode Configuration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize Google Consent Mode
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              
              // Set default consent state to 'denied' for EU regions
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied',
                'functionality_storage': 'denied',
                'personalization_storage': 'denied',
                'security_storage': 'granted',
                'wait_for_update': 2000,
                'region': ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'IS', 'LI', 'NO']
              });
              
              // Set default consent for non-EU regions
              gtag('consent', 'default', {
                'ad_storage': 'granted',
                'ad_user_data': 'granted', 
                'ad_personalization': 'granted',
                'analytics_storage': 'granted',
                'functionality_storage': 'granted',
                'personalization_storage': 'granted',
                'security_storage': 'granted'
              });
              
              // Initialize gtag
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}', {
                'anonymize_ip': true,
                'allow_google_signals': false,
                'allow_ad_personalization_signals': false
              });
              
              // Listen for Cookiebot consent changes
              window.addEventListener('CookiebotOnAccept', function (e) {
                gtag('consent', 'update', {
                  'analytics_storage': Cookiebot.consent.statistics ? 'granted' : 'denied',
                  'ad_storage': Cookiebot.consent.marketing ? 'granted' : 'denied',
                  'ad_user_data': Cookiebot.consent.marketing ? 'granted' : 'denied',
                  'ad_personalization': Cookiebot.consent.marketing ? 'granted' : 'denied',
                  'functionality_storage': Cookiebot.consent.preferences ? 'granted' : 'denied',
                  'personalization_storage': Cookiebot.consent.preferences ? 'granted' : 'denied'
                });
              });
              
              window.addEventListener('CookiebotOnDecline', function (e) {
                gtag('consent', 'update', {
                  'analytics_storage': 'denied',
                  'ad_storage': 'denied',
                  'ad_user_data': 'denied',
                  'ad_personalization': 'denied',
                  'functionality_storage': 'denied',
                  'personalization_storage': 'denied'
                });
              });
            `,
          }}
        />
        
        {/* Google Analytics 4 Script */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID}`}
        />
        
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} ${limelight.variable}`} suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'white',
                color: 'black',
                border: '1px solid #e5e7eb',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
