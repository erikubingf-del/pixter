// src/app/layout.tsx
import type { Metadata } from 'next'
import { IBM_Plex_Sans } from 'next/font/google'
import './globals.css'

import { AuthProvider } from '@/lib/auth/session'
import NavBar from '@/components/NavBar'
import NavBarWrapper from '@/components/NavBarWrapper'

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
})

export const metadata: Metadata = {
  title: 'AmoPagar - Pagamento rápido para vendedores e motoristas',
  description:
    'Receba pagamentos via QR code sem maquininha. Pix, Apple Pay e cartão de crédito.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${ibmPlexSans.variable} ${ibmPlexSans.className}`}>
        {/* Contexto de autenticação */}
        <AuthProvider>
          {/* Barra de navegação com logo P + dropdown */}
          {/* <NavBar /> */}
          <NavBarWrapper/>

          {/* Conteúdo das rotas */}
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}