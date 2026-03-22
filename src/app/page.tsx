'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Logo from '@/components/Logo'

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <main style={{ minHeight: '100vh', background: '#F5F6FA', fontFamily: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* Navbar */}
      <nav style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        padding: '0 1.25rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Logo */}
        <Logo />

        {/* Desktop Nav links */}
        <div className="amopagar-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <a href="https://amopagar-397jys9za-crmlx.vercel.app/login" style={{ color: '#52606D', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Para Motoristas</a>
          <a href="https://amopagar-397jys9za-crmlx.vercel.app/login" style={{ color: '#52606D', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Para Clientes</a>
          <a href="#recursos" style={{ color: '#52606D', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Recursos</a>
          <a href="#seguranca" style={{ color: '#52606D', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Segurança</a>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {/* Hamburger on mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="amopagar-hamburger"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              color: '#374151'
            }}
            aria-label="Menu"
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <Link href="/cadastro" style={{
            padding: '0.5rem 1.125rem',
            borderRadius: '999px',
            background: '#6C5DD3',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.875rem',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(108,93,211,0.35)',
            whiteSpace: 'nowrap'
          }}>
            Criar conta
          </Link>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div style={{
          position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0,
          background: 'white', zIndex: 99, padding: '2rem 1.25rem',
          display: 'flex', flexDirection: 'column', gap: '1.5rem',
          borderTop: '1px solid rgba(0,0,0,0.05)'
        }}>
          <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} style={{
            fontSize: '1.1rem', fontWeight: '600', color: '#111827', textDecoration: 'none',
            padding: '1rem', background: '#F3F4F6', borderRadius: '12px', textAlign: 'center'
          }}>
            Fazer Login
          </Link>
          <Link href="/cadastro" onClick={() => setIsMobileMenuOpen(false)} style={{
            fontSize: '1.1rem', fontWeight: '600', color: 'white', textDecoration: 'none',
            padding: '1rem', background: '#6C5DD3', borderRadius: '12px', textAlign: 'center',
            boxShadow: '0 4px 14px rgba(108,93,211,0.35)'
          }}>
            Criar conta
          </Link>

          <div style={{ height: '1px', background: '#E5E7EB', margin: '1rem 0' }} />

          <a href="https://amopagar-397jys9za-crmlx.vercel.app/login" onClick={() => setIsMobileMenuOpen(false)} style={{ color: '#52606D', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '500' }}>Para Motoristas</a>
          <a href="https://amopagar-397jys9za-crmlx.vercel.app/login" onClick={() => setIsMobileMenuOpen(false)} style={{ color: '#52606D', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '500' }}>Para Clientes</a>
          <a href="#recursos" onClick={() => setIsMobileMenuOpen(false)} style={{ color: '#52606D', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '500' }}>Recursos</a>
          <a href="#seguranca" onClick={() => setIsMobileMenuOpen(false)} style={{ color: '#52606D', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '500' }}>Segurança</a>
        </div>
      )}

      {/* Hero Section */}
      <section className="amopagar-hero" style={{
        padding: '3rem 1.25rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '3rem',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Decorative Dots */}
        <div style={{
          position: 'absolute', top: '10%', right: '5%', width: '120px', height: '120px',
          backgroundImage: 'radial-gradient(#CBD5E1 2px, transparent 2px)',
          backgroundSize: '16px 16px', opacity: 0.5, zIndex: 0
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', left: '-2%', width: '120px', height: '120px',
          backgroundImage: 'radial-gradient(#CBD5E1 2px, transparent 2px)',
          backgroundSize: '16px 16px', opacity: 0.5, zIndex: 0
        }} />
        <div style={{
          position: 'absolute', top: '40%', right: '45%', width: '80px', height: '120px',
          backgroundImage: 'radial-gradient(#CBD5E1 2px, transparent 2px)',
          backgroundSize: '16px 16px', opacity: 0.5, zIndex: 0
        }} />

        {/* Left: Text */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '800',
            lineHeight: '1.1',
            color: '#1F2937',
            marginBottom: '1.25rem',
            letterSpacing: '-0.02em',
            fontFamily: "'Inter', sans-serif"
          }}>
            Pagamentos simples,<br />
            rápidos e <span style={{ color: '#00C9A7' }}>confiáveis.</span>
          </h1>

          <p style={{
            fontSize: '1.125rem',
            color: '#4B5563',
            lineHeight: '1.6',
            marginBottom: '2rem',
            maxWidth: '480px'
          }}>
            Aceite Pix, Cartão de Crédito e Apple Pay direto. Sem celular, sem máquina, sem
            mensalidade.
          </p>

          {/* Payment method badges */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              border: '1px solid #E5E7EB', borderRadius: '999px',
              padding: '0.5rem 1rem', background: 'white', fontSize: '0.875rem', fontWeight: '500', color: '#374151',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <Image src="/images/logos/pix.png" alt="Pix" width={20} height={20} unoptimized style={{ objectFit: 'contain' }} />
              Pix
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              border: '1px solid #E5E7EB', borderRadius: '999px',
              padding: '0.5rem 1rem', background: 'white', fontSize: '0.875rem', fontWeight: '500', color: '#374151',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <svg width="24" height="15" viewBox="0 0 38 24" fill="none">
                <rect width="38" height="24" rx="4" fill="#1A1F71" />
                <circle cx="15" cy="12" r="7" fill="#EB001B" />
                <circle cx="23" cy="12" r="7" fill="#F79E1B" />
                <path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#FF5F00" />
              </svg>
              Cartão de Crédito
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              border: '1px solid #E5E7EB', borderRadius: '999px',
              padding: '0.5rem 1rem', background: 'white', fontSize: '0.875rem', fontWeight: '500', color: '#374151',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <svg width="16" height="19" viewBox="0 0 814 1000" fill="currentColor">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.1 135.3-317.2 269-317.2 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.5-49.1 189.8-49.1 30.8 0 130.1 2.6 198.3 99zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
              </svg>
              Apple Pay
            </div>
          </div>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <Link href="/cadastro?mode=driver" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: '#6C5DD3',
              color: 'white',
              padding: '0.875rem 2rem',
              borderRadius: '999px',
              fontWeight: '600',
              fontSize: '1rem',
              textDecoration: 'none',
            }}>
              Começar agora <span>→</span>
            </Link>
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.625rem',
              background: 'transparent', border: 'none',
              color: '#374151', fontSize: '1rem', fontWeight: '500', cursor: 'pointer', padding: 0
            }}>
              <span style={{
                width: '40px', height: '40px',
                background: 'white', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', color: '#6C5DD3'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </span>
              Ver como funciona
            </button>
          </div>
        </div>

        {/* Right: Phone Mockup & Cards Background */}
        <div className="amopagar-phone-wrap" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>

          {/* AI Generated Decorative Cards Background */}
          <div style={{
            position: 'absolute',
            width: '120%',
            height: '120%',
            top: '50%',
            left: '50%',
            transform: 'translate(-40%, -50%)',
            zIndex: 0,
            opacity: 0.9
          }}>
            <Image
              src="/images/hero-cards-bg.png"
              alt="Background Cards"
              fill
              sizes="(min-width: 1024px) 40vw, 90vw"
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>

          {/* Phone Mockup */}
          <div style={{
            position: 'relative', zIndex: 1,
            width: '240px',
            background: '#F1F5F9', // Light gray/silver edge
            borderRadius: '38px',
            padding: '10px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 0 0 2px #FFFFFF',
            transform: 'rotate(2deg) translateX(-10px)' // Tilt slightly
          }}>
            {/* Dynamic Island / Notch */}
            <div style={{ width: '80px', height: '22px', background: '#111827', borderRadius: '12px', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#374151' }}></div>
            </div>

            <div style={{ background: '#F8FAFC', borderRadius: '28px', padding: '1.25rem', minHeight: '400px', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.1)' }}>
              {/* Fake status bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.65rem', fontWeight: '600', color: '#1F2937' }}>
                <span>9:41</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span>LTE</span>
                  <div style={{ width: '18px', height: '10px', border: '1px solid #1F2937', borderRadius: '2px', padding: '1px' }}><div style={{ width: '70%', height: '100%', background: '#1F2937', borderRadius: '1px' }}></div></div>
                </div>
              </div>

              {/* Fake browser bar */}
              <div style={{ background: '#E2E8F0', borderRadius: '8px', padding: '0.4rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', color: '#475569', fontSize: '0.75rem' }}>
                <span>AA</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg> amopagar.com</span>
                <span>⟳</span>
              </div>

              {/* Search bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: '#F1F5F9', borderRadius: '8px',
                padding: '0.5rem 0.75rem', marginBottom: '1.25rem'
              }}>
                <svg width="14" height="14" fill="none" stroke="#94A3B8" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Cobrar Pagamento</span>
              </div>

              {/* Amount */}
              <p style={{ textAlign: 'center', fontSize: '2rem', fontWeight: '800', color: '#111827', marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
                R$ 150,00
              </p>

              {/* Keypad */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '1.25rem' }}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '='].map(k => (
                  <div key={k} style={{
                    textAlign: 'center', padding: '0.5rem 0',
                    background: 'white', borderRadius: '6px',
                    fontSize: '0.85rem', fontWeight: '500', color: '#1F2937',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}>{k}</div>
                ))}
              </div>

              {/* Cobrar button */}
              <div style={{
                background: '#6C5DD3',
                color: 'white', textAlign: 'center',
                padding: '0.75rem', borderRadius: '10px',
                fontWeight: '600', fontSize: '0.9rem',
                boxShadow: '0 4px 12px rgba(108,93,211,0.25)'
              }}>Cobrar</div>
            </div>
          </div>

          {/* Floating: Apple Pay */}
          <div style={{
            position: 'absolute', left: '-5%', bottom: '25%', zIndex: 2,
            background: '#111827', color: 'white',
            borderRadius: '12px', padding: '0.625rem 1rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.875rem', fontWeight: '600',
            transform: 'rotate(-4deg)'
          }}>
            <svg width="15" height="18" viewBox="0 0 814 1000" fill="white">
              <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.1 135.3-317.2 269-317.2 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.5-49.1 189.8-49.1 30.8 0 130.1 2.6 198.3 99zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
            </svg>
            Pay
          </div>

          {/* Check badge */}
          <div style={{
            position: 'absolute', right: '5%', top: '30%', zIndex: 2,
            background: '#22C55E', color: 'white',
            borderRadius: '50%', width: '44px', height: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(34,197,94,0.3)'
          }}>
            <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="amopagar-cards" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 1.25rem 3.5rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.25rem'
      }}>
        {/* Drivers card */}
        <div id="motoristas"
          onClick={(e) => { if (!(e.target as HTMLElement).closest('a')) window.location.href = 'https://amopagar-397jys9za-crmlx.vercel.app/login' }}
          style={{
            background: 'linear-gradient(135deg, #A7F3D0 0%, #3B82F6 50%, #6C5DD3 100%)',
            borderRadius: '20px',
            padding: '1.75rem',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" fill="none" stroke="white" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5h-2" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /><polyline points="16 8 13 8 13 3" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Para Motoristas e Vendedores</h3>
          </div>
          <p style={{ opacity: 0.92, fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.55', flex: 1 }}>
            Receba pagamentos pelo celular. Sem complicação.
          </p>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            <Link href="/cadastro?mode=driver" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: 'white', color: '#00C9A7',
              padding: '0.55rem 1.25rem', borderRadius: '999px',
              fontWeight: '700', fontSize: '0.875rem', textDecoration: 'none'
            }}>
              Criar conta →
            </Link>
            <Link href="https://amopagar-397jys9za-crmlx.vercel.app/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: 'rgba(255,255,255,0.18)', color: 'white',
              padding: '0.55rem 1.25rem', borderRadius: '999px',
              fontWeight: '600', fontSize: '0.875rem', textDecoration: 'none',
              border: '1.5px solid rgba(255,255,255,0.4)'
            }}>
              Entrar
            </Link>
          </div>
        </div>

        {/* Clients card */}
        <div id="clientes"
          onClick={(e) => { if (!(e.target as HTMLElement).closest('a')) window.location.href = 'https://amopagar-397jys9za-crmlx.vercel.app/login' }}
          style={{
            background: 'linear-gradient(135deg, #A78BFA 0%, #3B82F6 100%)',
            borderRadius: '20px',
            padding: '1.75rem',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer'
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.625rem' }}>
            <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" fill="none" stroke="white" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Para Clientes</h3>
          </div>
          <p style={{ opacity: 0.92, fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.55', flex: 1 }}>
            Pague com cartão, Pix ou Apple Pay. Tudo em um só lugar.
          </p>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            <Link href="/cadastro" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: 'white', color: '#6C5DD3',
              padding: '0.55rem 1.25rem', borderRadius: '999px',
              fontWeight: '700', fontSize: '0.875rem', textDecoration: 'none'
            }}>
              Criar conta →
            </Link>
            <Link href="https://amopagar-397jys9za-crmlx.vercel.app/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: 'rgba(255,255,255,0.18)', color: 'white',
              padding: '0.55rem 1.25rem', borderRadius: '999px',
              fontWeight: '600', fontSize: '0.875rem', textDecoration: 'none',
              border: '1.5px solid rgba(255,255,255,0.4)'
            }}>
              Entrar
            </Link>
          </div>
        </div>
      </section>

      {/* Recursos Section */}
      <section id="recursos" style={{
        background: 'white',
        padding: '4rem 1.25rem',
        borderTop: '1px solid #E5E7EB'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{
              display: 'inline-block',
              background: '#EDE9FF',
              color: '#6C5DD3',
              fontWeight: '600',
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '0.35rem 1rem',
              borderRadius: '999px',
              marginBottom: '1rem'
            }}>Recursos</span>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: '800',
              color: '#1F2937',
              lineHeight: '1.2',
              marginBottom: '1rem',
              fontFamily: "'Inter', sans-serif"
            }}>
              Tudo que você precisa para receber.
            </h2>
            <p style={{ color: '#52606D', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto' }}>
              Sem maquininha, sem mensalidade, sem complicação. Seu link de pagamento pronto em minutos.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            {[
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="#6C5DD3" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                ),
                title: 'Link de Pagamento Instantâneo',
                desc: 'Compartilhe um link ou QR Code personalizado. Seu cliente paga em segundos, de qualquer lugar.'
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="#6C5DD3" strokeWidth="1.75" viewBox="0 0 24 24">
                    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                ),
                title: 'Pix, Cartão e Apple Pay',
                desc: 'Aceite todas as formas de pagamento. Pix instantâneo, cartão de crédito e carteiras digitais.'
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="#6C5DD3" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" /><path d="M12 8v4l3 3" />
                  </svg>
                ),
                title: 'Histórico em Tempo Real',
                desc: 'Acompanhe cada pagamento recebido, com data, valor e forma de pagamento. Tudo registrado.'
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="#6C5DD3" strokeWidth="1.75" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                  </svg>
                ),
                title: 'Sem Mensalidade',
                desc: 'Cadastro gratuito. Você só paga uma taxa mínima por transação bem-sucedida — sem custos fixos.'
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="#6C5DD3" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                ),
                title: 'Comprovante Automático',
                desc: 'Recibo gerado automaticamente após cada pagamento. Seu cliente recebe a confirmação na hora.'
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" stroke="#6C5DD3" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ),
                title: 'Perfil Profissional',
                desc: 'Personalize seu nome, profissão e avatar. Seus clientes veem uma página limpa e confiável.'
              }
            ].map((item) => (
              <div key={item.title} style={{
                background: '#F9FAFB',
                borderRadius: '16px',
                padding: '1.75rem',
                border: '1px solid #E5E7EB',
                transition: 'box-shadow 0.2s ease'
              }}>
                <div style={{
                  width: '48px', height: '48px',
                  background: '#EDE9FF',
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1F2937', marginBottom: '0.5rem' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#52606D', lineHeight: '1.6', margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Segurança Section */}
      <section id="seguranca" style={{
        background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
        padding: '4rem 1.25rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(108,93,211,0.3)',
              color: '#A78BFA',
              fontWeight: '600',
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '0.35rem 1rem',
              borderRadius: '999px',
              marginBottom: '1rem'
            }}>Segurança</span>
            <h2 style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: '800',
              color: 'white',
              lineHeight: '1.2',
              marginBottom: '1rem',
              fontFamily: "'Inter', sans-serif"
            }}>
              Seus pagamentos, protegidos.
            </h2>
            <p style={{ color: '#9CA3AF', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto' }}>
              Usamos as mesmas tecnologias de segurança dos maiores bancos do mundo.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            marginBottom: '3rem'
          }}>
            {[
              {
                icon: (
                  <svg width="22" height="22" fill="none" stroke="#A78BFA" strokeWidth="1.75" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                ),
                title: 'Criptografia SSL/TLS',
                desc: 'Todas as comunicações são criptografadas com SSL de 256 bits — o padrão bancário.'
              },
              {
                icon: (
                  <svg width="22" height="22" fill="none" stroke="#A78BFA" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
                title: 'Powered by Stripe',
                desc: 'Processamento de cartões via Stripe, certificado PCI DSS Level 1 — o nível mais alto de segurança.'
              },
              {
                icon: (
                  <svg width="22" height="22" fill="none" stroke="#A78BFA" strokeWidth="1.75" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                  </svg>
                ),
                title: 'LGPD Compliant',
                desc: 'Seus dados são tratados com total conformidade com a Lei Geral de Proteção de Dados.'
              },
              {
                icon: (
                  <svg width="22" height="22" fill="none" stroke="#A78BFA" strokeWidth="1.75" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ),
                title: 'Pix via Banco Central',
                desc: 'O Pix é regulado pelo Banco Central do Brasil. Transações instantâneas e rastreáveis.'
              }
            ].map((item) => (
              <div key={item.title} style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{
                  width: '44px', height: '44px',
                  background: 'rgba(108,93,211,0.25)',
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  {item.icon}
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#9CA3AF', lineHeight: '1.6', margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA inside security section */}
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            background: 'rgba(108,93,211,0.15)',
            borderRadius: '20px',
            border: '1px solid rgba(108,93,211,0.3)'
          }}>
            <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.75rem' }}>
              Pronto para começar?
            </h3>
            <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Cadastre-se gratuitamente e comece a receber pagamentos em minutos.
            </p>
            <Link href="/cadastro?mode=driver" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: '#6C5DD3',
              color: 'white',
              padding: '0.875rem 2rem',
              borderRadius: '999px',
              fontWeight: '600',
              fontSize: '1rem',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(108,93,211,0.4)'
            }}>
              Criar conta gratuita →
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section style={{
        background: 'white',
        borderTop: '1px solid #E5E7EB',
        padding: '1.5rem 1.25rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '3rem',
        flexWrap: 'wrap'
      }}>
        {[
          {
            icon: (
              <svg width="20" height="20" fill="none" stroke="#6C5DD3" strokeWidth="1.75" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            ), label: 'Seguro'
          },
          {
            icon: (
              <svg width="20" height="20" fill="none" stroke="#6C5DD3" strokeWidth="1.75" viewBox="0 0 24 24">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            ), label: 'Rápido'
          },
          {
            icon: (
              <svg width="20" height="20" fill="none" stroke="#6C5DD3" strokeWidth="1.75" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            ), label: 'Sem Mensalidade'
          },
          {
            icon: (
              <svg width="20" height="20" fill="none" stroke="#6C5DD3" strokeWidth="1.75" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.56 2 2 0 0 1 3.6 1.38h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.5 16.92z" />
              </svg>
            ), label: 'Suporte 24/7'
          },
        ].map(({ icon, label }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            {icon}
            <span style={{ fontSize: '0.8rem', color: '#52606D', fontWeight: '500' }}>{label}</span>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{ padding: '2rem 1.25rem', background: '#1F2937', color: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
                <Logo />
              </div>
              <p style={{ color: '#9CA3AF', fontSize: '0.8rem', lineHeight: '1.6' }}>
                Pagamentos simples para motoristas e clientes.
              </p>
            </div>
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '0.625rem', fontSize: '0.85rem', color: '#E5E7EB' }}>Produto</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '0.4rem' }}><Link href="/login" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.825rem' }}>Login</Link></li>
                <li><Link href="/cadastro?mode=driver" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.825rem' }}>Cadastro Motorista</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '0.625rem', fontSize: '0.85rem', color: '#E5E7EB' }}>Suporte</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '0.4rem' }}><Link href="/termos" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.825rem' }}>Termos de Uso</Link></li>
                <li><Link href="/privacidade" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '0.825rem' }}>Privacidade</Link></li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #374151', paddingTop: '1.25rem', textAlign: 'center', color: '#6B7280', fontSize: '0.775rem' }}>
            AmoPagar © 2025 · Todos os direitos reservados.
          </div>
        </div>
      </footer>

      <style jsx>{`
        @media (max-width: 768px) {
          .amopagar-nav-links { display: none !important; }
          .amopagar-hamburger { display: flex !important; }
          .amopagar-hero {
            grid-template-columns: 1fr !important;
            padding: 2rem 1.25rem 0 !important;
            gap: 0 !important;
          }
          .amopagar-phone-wrap {
            margin-top: -1rem;
            transform: scale(0.9);
          }
          .amopagar-cards {
            grid-template-columns: 1fr !important;
          }
          .amopagar-hide-mobile { display: none !important; }
        }
        @media (max-width: 480px) {
          .amopagar-phone-wrap { transform: scale(0.82); }
        }
      `}</style>
    </main>
  )
}
