# AmoPagar - Complete Product Specification

## 🎯 Product Vision

AmoPagar is a unified payment platform where **drivers/vendors** can accept payments and **clients** can manage their payment history - all in one simple, friendly application.

## 👥 User Types & Journey

### 🚗 Driver/Vendor
**Who**: Taxi drivers, food vendors, market sellers, small business owners

**Journey**:
1. **Sign up** with phone number (WhatsApp OTP)
2. **Access unified dashboard** immediately (same features as clients)
3. **See "Connect Stripe" prompt** in payment link section (locked until connected)
4. **Connect Stripe** via simple flow (Stripe Connect/Marketplace)
5. **Share payment link** or show QR code to customers
6. **Receive 95% of payments** (AmoPagar keeps 5%, pays 3-4% to Stripe)

**Features**:
- ✅ Payment history (same as clients)
- ✅ Saved cards (for when they're buyers)
- ✅ Receipts with business expense categorization
- ✅ **Payment Link** (unique URL: `amopagar.com/5511999999999`)
- ✅ **QR Code Button** (large display for customers to scan)
- ✅ **Stripe Alerts** (account status, payouts, issues)
- ✅ **Settings**:
  - Profile (avatar, name, company name for invoices)
  - Address
  - Phone number management
  - **Switch to Client** (removes Stripe, becomes regular client)

### 💳 Client/Customer
**Who**: Anyone making payments via AmoPagar

**Journey**:
1. **Sign up** with email/Google or phone
2. **Access unified dashboard**
3. **Make payments** to drivers via payment links
4. **View payment history**
5. **Download receipts** for business expenses

**Features**:
- ✅ Payment history with search/filter
- ✅ Saved payment methods (cards)
- ✅ Receipts section with:
  - **"Business Expense?"** checkbox per receipt
  - **Export All PDFs** button → download/share via WhatsApp/Email
- ✅ **Settings**:
  - Profile (avatar, name)
  - Saved cards management
  - **Become a Driver** (adds driver features, requires Stripe setup)

## 📱 Page Structure

### Landing Page (`/`)
- **Header**: AmoPagar logo
- **Hero**:
  - Two gradient CTAs side-by-side
  - 🚗 **For Drivers**: "Cadastrar agora" → `/motorista/cadastro`
  - 💳 **For Clients**: "Criar conta grátis" → `/cadastro`
  - Login links for both types
- **Features**: Instant Pix, Safe & Secure, Trusted Vendors
- **Pricing**: Clear fee structure (5% total)
- **Footer**: Links, Stripe badge

### Authentication

#### Client Login (`/login`)
- Email + Password OR Google OAuth
- Purple theme (#8B7DD8)
- Link to driver login

#### Client Signup (`/cadastro`)
- Name, Email, Password, Confirm Password
- Terms acceptance
- Google OAuth option
- Creates user with `tipo: 'cliente'`

#### Driver Login (`/motorista/login`)
- Phone number + WhatsApp OTP (6 digits)
- Green theme (#81C995)
- 60-second resend countdown
- Link to client login

#### Driver Signup (`/motorista/cadastro`)
- **Step 1**: Nome, CPF, Phone
- **Step 2**: Optional - can complete later in settings
- Creates user with `tipo: 'motorista'`
- Stripe connection happens later (not required at signup)

### Unified Dashboard (`/dashboard` or `/cliente/dashboard`)

**For All Users (Client OR Driver)**:

```
┌─────────────────────────────────────┐
│ 👤 Olá, [Nome]                      │
├─────────────────────────────────────┤
│                                     │
│  💳 Últimos Pagamentos              │
│  ├─ R$ 45,00 - Motorista João      │
│  ├─ R$ 120,00 - Feira Central      │
│  └─ Ver todos →                    │
│                                     │
│  📄 Meus Comprovantes               │
│  ├─ [x] Negócio  REC-123456        │
│  ├─ [ ] Pessoal  REC-123457        │
│  └─ Exportar PDFs →                │
│                                     │
│  💾 Cartões Salvos                  │
│  ├─ Visa •••• 4242                │
│  └─ Adicionar cartão →             │
│                                     │
└─────────────────────────────────────┘
```

**Additional for Drivers ONLY** (shows below standard features):

```
┌─────────────────────────────────────┐
│  🚗 Recursos do Motorista           │
│                                     │
│  🔗 Meu Link de Pagamento           │
│  │  [Se Stripe conectado]          │
│  │  amopagar.com/5511999999999     │
│  │  [📱 Ver QR Code Grande]        │
│  │                                 │
│  │  [Se Stripe NÃO conectado]      │
│  │  🔒 Conectar Stripe para ativar │
│  │  [Conectar Agora →]             │
│  │                                 │
│  ⚠️ Alertas da Conta                │
│  ├─ ✅ Conta ativa                  │
│  └─ 💰 Último repasse: R$ 450,00   │
│                                     │
└─────────────────────────────────────┘
```

### Payment Page (`/[phoneNumber]` or `/p/[id]`)

**Customer View**:
```
┌─────────────────────────────────────┐
│  AmoPagar                           │
│  Pagando para: [Nome do Motorista] │
├─────────────────────────────────────┤
│                                     │
│      R$ ___________                 │
│      [Large input field]            │
│                                     │
│  Escolha a forma de pagamento:      │
│                                     │
│  [📱 Pix            ]  ←selected    │
│  [💳 Cartão de Crédito]            │
│  [🍎 Apple Pay       ]             │
│                                     │
│  [         Pagar R$ XX,XX         ] │
│                                     │
│  🔒 Pagamento seguro via Stripe     │
│                                     │
└─────────────────────────────────────┘
```

### Settings (`/settings` or `/perfil`)

**For All Users**:
- Avatar upload
- Name
- Email (for clients) / Phone (for drivers)
- Address (optional)
- Company name (for invoice generation)

**Account Type Toggle**:
```
┌─────────────────────────────────────┐
│  Tipo de Conta                      │
│                                     │
│  [If Client]                        │
│  Sua conta: Cliente                 │
│  Quer receber pagamentos?           │
│  [Tornar-se Motorista →]            │
│  (Requer conexão com Stripe)        │
│                                     │
│  [If Driver]                        │
│  Sua conta: Motorista/Vendedor      │
│                                     │
│  Stripe: [✅ Conectado | ⚠️ Pendente]│
│  [Gerenciar Conta Stripe →]         │
│                                     │
│  Quer apenas usar como cliente?     │
│  [Converter para Cliente]           │
│  ⚠️ Isto removerá sua conexão Stripe│
│                                     │
└─────────────────────────────────────┘
```

## 💰 Fee Structure

### Revenue Model
- **Total Fee**: 5% of transaction
- **Stripe Cost**: 3-4% (varies by payment method)
- **AmoPagar Profit**: 1-2% per transaction

### Example Transaction
```
Customer pays: R$ 100,00
────────────────────────
Stripe fee (3.5%): R$ 3,50
AmoPagar fee (5%): R$ 5,00
────────────────────────
Driver receives: R$ 95,00
AmoPagar keeps: R$ 1,50
```

## 🗄️ Database Schema

### profiles table
```sql
- id (uuid, PK)
- nome (text)
- email (text, unique)
- celular (text, unique) -- E.164 format
- cpf (text) -- for drivers
- avatar_url (text)
- tipo ('cliente' | 'motorista')
- account ('email' | 'phone' | 'google')
- stripe_account_id (text) -- Stripe Connect ID
- company_name (text) -- for invoices
- address (text)
- verified (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### pagamentos table
```sql
- id (uuid, PK)
- cliente_id (uuid, FK → profiles)
- motorista_id (uuid, FK → profiles)
- stripe_payment_id (text)
- charge_id (text)
- valor (integer) -- cents
- metodo ('pix' | 'card' | 'apple_pay')
- status ('pending' | 'succeeded' | 'failed')
- receipt_number (text, unique) -- REC-XXXXXX
- receipt_pdf_url (text)
- receipt_url (text) -- Stripe receipt
- is_business_expense (boolean) -- client categorization
- created_at (timestamp)
```

## 🔐 Stripe Integration

### Stripe Connect (Marketplace Model)

**Setup Flow**:
1. Driver clicks "Conectar Stripe" in dashboard
2. Redirect to Stripe onboarding (`/api/stripe/create-connect-account`)
3. Stripe collects: Bank account, Tax info, Identity verification
4. Return to AmoPagar with `stripe_account_id`
5. Store in `profiles.stripe_account_id`

**Payment Flow**:
1. Customer visits `/5511999999999`
2. Enters amount + selects payment method
3. Payment Intent created on **connected account** (driver's Stripe)
4. **Application Fee**: 5% goes to platform
5. **Automatic payout** to driver's bank account

**API Endpoints**:
- `POST /api/stripe/create-connect-account` - Start onboarding
- `POST /api/stripe/onboarding-refresh` - Resume incomplete onboarding
- `GET /api/stripe/account-status` - Check account status
- `POST /api/stripe/create-payment-intent` - Process payment

## 📊 Key Features Implementation

### QR Code Generation
```typescript
// Generate QR code for payment link
import QRCode from 'qrcode'

const paymentUrl = `https://amopagar.com/${phoneNumber}`
const qrCodeDataUrl = await QRCode.toDataURL(paymentUrl, {
  width: 400,
  margin: 2,
  color: {
    dark: '#1F2933',
    light: '#FFFFFF'
  }
})
```

### Receipt PDF Export
```typescript
// Export all receipts as PDFs
const exportAllReceipts = async (receipts) => {
  const zip = new JSZip()

  for (const receipt of receipts) {
    const pdfBlob = await fetch(receipt.receipt_pdf_url).then(r => r.blob())
    zip.file(`${receipt.receipt_number}.pdf`, pdfBlob)
  }

  const zipBlob = await zip.generateAsync({type: 'blob'})

  // Download or share
  const url = URL.createObjectURL(zipBlob)
  window.open(url) // Or trigger WhatsApp/Email share
}
```

### Business Expense Toggle
```typescript
// Toggle receipt as business expense
const toggleBusinessExpense = async (receiptId: string, isBusinessExpense: boolean) => {
  await fetch(`/api/receipts/${receiptId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_business_expense: isBusinessExpense })
  })
}
```

## 🎨 Design System

### Colors
- **Purple** (#8B7DD8): Client-facing elements, primary CTAs
- **Green** (#81C995): Driver-facing elements, success states
- **Gray Scale**: #1F2933 (text) to #F9FAFB (backgrounds)

### Components (in `amopagar-theme.css`)
- `.amo-btn-primary` - Purple button
- `.amo-btn-secondary` - Green button
- `.amo-input` - Rounded input field
- `.amo-card` - White card with shadow
- `.amo-steps` - Progress indicator (for multi-step forms)

## 🚀 Deployment Checklist

### Environment Variables
```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://amopagar.com

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# WhatsApp/SMS (for OTP)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

### Security Considerations
1. **CPF Storage**: Encrypt CPF in database (compliance)
2. **Stripe Webhook**: Verify signatures
3. **Rate Limiting**: SMS OTP (prevent abuse)
4. **RLS Policies**: Supabase Row Level Security
5. **CORS**: Restrict to amopagar.com domain

## 📱 Mobile Considerations

### QR Code Display
- **Large Button**: "Ver QR Code" on driver dashboard
- **Full-Screen Modal**: When clicked, show QR at maximum size
- **Screenshot Instructions**: "Mostre este código ao cliente"
- **Share Button**: Share image via WhatsApp/Telegram

### Responsive Breakpoints
- Mobile: < 640px (single column, large touch targets)
- Tablet: 640px - 1024px (two columns)
- Desktop: > 1024px (full layout)

## 🎯 Success Metrics

### For Drivers
- Time to first payment link share: < 5 minutes
- Stripe connection completion rate: > 80%
- Average transaction value: R$ 50-100

### For Clients
- Receipt download rate: > 60%
- Business expense categorization rate: > 40%
- Repeat payment rate: > 70%

### Platform
- Transaction success rate: > 95%
- Average fee per transaction: 1.5%
- Monthly active users: Track growth

## 🔄 Future Enhancements

### Phase 2
- [ ] Multi-currency support
- [ ] Boleto payment method
- [ ] Recurring payments / subscriptions
- [ ] Driver analytics dashboard (charts, insights)
- [ ] Bulk receipt export by date range
- [ ] WhatsApp notifications for payments

### Phase 3
- [ ] Mobile app (React Native)
- [ ] NFC tap-to-pay
- [ ] Split payments (multiple payers)
- [ ] Loyalty/rewards program
- [ ] API for third-party integrations

---

**Last Updated**: 2025-11-22
**Version**: 1.0
**Status**: In Development

For implementation details, see:
- `AMOPAGAR_DESIGN_GUIDE.md` - Design system specs
- `AMOPAGAR_IMPLEMENTATION_STATUS.md` - Current progress tracker
