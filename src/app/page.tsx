'use client'

import Link from 'next/link'
import Image from 'next/image'
import '../styles/amopagar-theme.css'

export default function Home() {
  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F0E7FC 0%, #E8F5E9 100%)' }}>

      {/* Hero Section */}
      <section className="amo-hero">
        <div className="amo-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>

            {/* Hero Content */}
            <div className="amo-fade-in">
              <h1 style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                fontWeight: '800',
                marginBottom: '1.5rem',
                lineHeight: '1.2',
                color: '#1F2933'
              }}>
                Pagamentos simples, rápidos e confiáveis.
              </h1>

              <p style={{
                fontSize: '1.25rem',
                color: '#52606D',
                marginBottom: '2.5rem',
                lineHeight: '1.8'
              }}>
                Aceite Pix, Cartão de Crédito e Apple Pay direto pelo celular. Sem maquininha, sem mensalidade.
              </p>

              {/* Dual CTAs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {/* For Drivers */}
                <div className="amo-card" style={{
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #D4FC79 0%, #81C995 100%)',
                  border: 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '2rem' }}>🚗</span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', margin: 0 }}>
                      Para Motoristas e Vendedores
                    </h3>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.95)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                    Receba pagamentos pelo celular. Sem maquininha, sem complicação.
                  </p>
                  <Link href="/motorista/cadastro" className="amo-btn" style={{
                    background: 'white',
                    color: '#81C995',
                    fontWeight: '600'
                  }}>
                    Cadastrar agora
                  </Link>
                </div>

                {/* For Clients */}
                <div className="amo-card" style={{
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #E0C3FC 0%, #8B7DD8 100%)',
                  border: 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '2rem' }}>💳</span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'white', margin: 0 }}>
                      Para Clientes
                    </h3>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.95)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                    Pague com cartão, Pix ou Apple Pay. Todos os comprovantes em um só lugar.
                  </p>
                  <Link href="/cadastro" className="amo-btn" style={{
                    background: 'white',
                    color: '#8B7DD8',
                    fontWeight: '600'
                  }}>
                    Criar conta grátis
                  </Link>
                </div>
              </div>

              {/* Login Links */}
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                flexWrap: 'wrap',
                fontSize: '0.875rem',
                color: '#52606D'
              }}>
                <Link href="/motorista/login" style={{
                  color: '#81C995',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}>
                  → Login Motorista
                </Link>
                <Link href="/login" style={{
                  color: '#8B7DD8',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}>
                  → Login Cliente
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="amo-fade-in" style={{ position: 'relative', animationDelay: '0.2s' }}>
              <div style={{
                background: 'white',
                borderRadius: 'var(--amo-radius-xl)',
                padding: '2rem',
                boxShadow: 'var(--amo-shadow-xl)',
                position: 'relative',
                transform: 'rotate(-2deg)',
                transition: 'transform 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-2deg)'}
              >
                <Image
                  src="/images/homepage/driver.png"
                  alt="Happy couple using AmoPagar"
                  width={500}
                  height={400}
                  unoptimized
                  style={{ width: '100%', height: 'auto', borderRadius: 'var(--amo-radius-md)' }}
                />

                {/* Floating Success Badge */}
                <div style={{
                  position: 'absolute',
                  top: '-1rem',
                  right: '-1rem',
                  background: 'var(--amo-green)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--amo-radius-full)',
                  fontWeight: '600',
                  boxShadow: 'var(--amo-shadow-lg)',
                  fontSize: '0.875rem'
                }}>
                  ✓ Payment Sent
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '6rem 2rem', background: 'white' }}>
        <div className="amo-container">
          <h2 className="amo-text-center" style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>
            Features
          </h2>
          <p className="amo-text-center" style={{ color: '#52606D', marginBottom: '4rem', fontSize: '1.125rem' }}>
            Everything you need to accept payments anywhere
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>

            {/* Feature 1 */}
            <div className="amo-card" style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #E0C3FC 0%, #8B7DD8 100%)',
                borderRadius: 'var(--amo-radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: '2.5rem'
              }}>
                📱
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                Instant Pix
              </h3>
              <p style={{ color: '#52606D' }}>
                Playful, custom illustrations to make Instant Pix.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="amo-card" style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #81C995 0%, #61A975 100%)',
                borderRadius: 'var(--amo-radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: '2.5rem'
              }}>
                🔒
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                Safe & Secure
              </h3>
              <p style={{ color: '#52606D' }}>
                Provide custom illustrations to secure safely.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="amo-card" style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #FFD93D 0%, #FFA93D 100%)',
                borderRadius: 'var(--amo-radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: '2.5rem'
              }}>
                🤝
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                Trusted Vendors
              </h3>
              <p style={{ color: '#52606D' }}>
                Improve custom trusted by trusted vendors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ padding: '6rem 2rem', background: 'linear-gradient(135deg, #F0E7FC 0%, #E8F5E9 100%)' }}>
        <div className="amo-container">
          <h2 className="amo-text-center" style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>
            Pricing
          </h2>
          <p className="amo-text-center" style={{ color: '#52606D', marginBottom: '4rem', fontSize: '1.125rem' }}>
            Simple, transparent pricing for everyone
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            maxWidth: '800px',
            margin: '0 auto'
          }}>

            {/* Free Plan */}
            <div className="amo-card-pricing">
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#8B7DD8' }}>
                Driver
              </h3>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: '800', color: '#1F2933' }}>R$60</span>
                <span style={{ color: '#52606D' }}>/month</span>
              </div>
              <p style={{ color: '#52606D', marginBottom: '2rem' }}>
                Prouide your account and priomatiae payment.
              </p>
              <button className="amo-btn amo-btn-secondary" style={{ width: '100%' }}>
                Buy now
              </button>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                marginTop: '2rem',
                textAlign: 'left'
              }}>
                <li style={{ padding: '0.5rem 0', color: '#52606D' }}>✓ Accept Pix payments</li>
                <li style={{ padding: '0.5rem 0', color: '#52606D' }}>✓ Credit card payments</li>
                <li style={{ padding: '0.5rem 0', color: '#52606D' }}>✓ Basic dashboard</li>
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="amo-card-pricing" style={{
              border: '3px solid var(--amo-purple)',
              transform: 'scale(1.05)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '-1rem',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--amo-purple)',
                color: 'white',
                padding: '0.5rem 1.5rem',
                borderRadius: 'var(--amo-radius-full)',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                MOST POPULAR
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#8B7DD8' }}>
                Business
              </h3>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: '800', color: '#1F2933' }}>R$135</span>
                <span style={{ color: '#52606D' }}>/month</span>
              </div>
              <p style={{ color: '#52606D', marginBottom: '2rem' }}>
                Prouide delear cards for existing payments.
              </p>
              <button className="amo-btn amo-btn-primary" style={{ width: '100%' }}>
                Buy now
              </button>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                marginTop: '2rem',
                textAlign: 'left'
              }}>
                <li style={{ padding: '0.5rem 0', color: '#52606D' }}>✓ Everything in Driver</li>
                <li style={{ padding: '0.5rem 0', color: '#52606D' }}>✓ Lower fees (3%)</li>
                <li style={{ padding: '0.5rem 0', color: '#52606D' }}>✓ Advanced analytics</li>
                <li style={{ padding: '0.5rem 0', color: '#52606D' }}>✓ Priority support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section style={{ padding: '6rem 2rem', background: 'white' }}>
        <div className="amo-container" style={{ maxWidth: '900px' }}>
          <div className="amo-testimonial">
            <div style={{ fontSize: '6rem', color: 'var(--amo-purple)', opacity: 0.2, lineHeight: 0.5 }}>
              "
            </div>
            <p style={{
              fontSize: '1.5rem',
              fontStyle: 'italic',
              color: '#1F2933',
              marginBottom: '2rem',
              lineHeight: '1.8'
            }}>
              AmoPagar design on wrm with she's fering, and oneme nairie together prra. We iife wer coollanagations and sendings od a cmwel enach.
            </p>
            <p style={{ fontWeight: '600', color: '#8B7DD8', fontSize: '1.125rem' }}>
              - Learn Maping
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '6rem 2rem',
        background: 'linear-gradient(135deg, #8B7DD8 0%, #81C995 100%)',
        color: 'white'
      }}>
        <div className="amo-container amo-text-center">
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
            Ready to start accepting payments?
          </h2>
          <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.95 }}>
            Join thousands of vendors already using AmoPagar
          </p>
          <Link href="/motorista/cadastro" className="amo-btn" style={{
            background: 'white',
            color: '#8B7DD8',
            padding: '1rem 3rem',
            fontSize: '1.125rem'
          }}>
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '3rem 2rem', background: '#1F2933', color: 'white' }}>
        <div className="amo-container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem', color: '#8B7DD8' }}>
                AmoPagar
              </h3>
              <p style={{ color: '#9AA5B1', fontSize: '0.875rem' }}>
                Payments that feel good. Simple, fast, and friendly.
              </p>
            </div>

            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '1rem' }}>Product</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Link href="/features" style={{ color: '#9AA5B1', textDecoration: 'none' }}>Features</Link>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Link href="/pricing" style={{ color: '#9AA5B1', textDecoration: 'none' }}>Pricing</Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '1rem' }}>Support</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Link href="/suporte" style={{ color: '#9AA5B1', textDecoration: 'none' }}>Help Center</Link>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Link href="/login" style={{ color: '#9AA5B1', textDecoration: 'none' }}>Login</Link>
                </li>
              </ul>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid #3E4C59',
            paddingTop: '2rem',
            textAlign: 'center',
            color: '#9AA5B1',
            fontSize: '0.875rem'
          }}>
            <p>AmoPagar © 2025 · Todos os direitos reservados.</p>
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span>Powered by</span>
              <Image src="/images/logos/stripe.png" alt="Stripe" width={60} height={20} unoptimized style={{ opacity: 0.7 }} />
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
