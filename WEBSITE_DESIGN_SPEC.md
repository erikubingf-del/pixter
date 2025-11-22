# AmoPagar.com - Complete Website Design Specification

**Brand Name:** AmoPagar (formerly Pixter)
**Purpose:** Payment platform for Brazilian street vendors/taxi drivers
**Target Market:** Brazil
**Key Feature:** 4% commission, Pix + Card payments

---

## 🎨 Brand Colors & Style

### Color Palette:
- **Primary:** Purple (#7C3AED) - Action buttons, links
- **Secondary:** Green (#10B981) - Success states, Pix
- **Accent:** Blue (#3B82F6) - Information boxes
- **Success:** Green (#10B981)
- **Error:** Red (#EF4444)
- **Warning:** Yellow (#F59E0B)
- **Gray Scale:**
  - Light: #F9FAFB
  - Medium: #6B7280
  - Dark: #111827

### Typography:
- **Font Family:** System default (SF Pro on iOS, Roboto on Android, Inter/Arial on web)
- **Headings:** Bold, 24-32px
- **Body Text:** Regular, 14-16px
- **Small Text:** 12-14px

---

## 📱 PAGE 1: Homepage (Landing Page)
**URL:** `/`

### Hero Section
**Layout:** Full-width, centered content

**Elements:**
1. **Logo:** "AmoPagar" - top left
2. **Navigation (top right):**
   - "Acessar Conta" (Login button)
   - "Criar Conta" (Signup button)

3. **Main Headline:** (Center, large, bold)
   ```
   Receba pagamentos com QR Code
   Direto na sua conta bancária
   ```

4. **Subheadline:** (Below headline, gray text)
   ```
   Aceite cartão, Pix e Apple Pay
   Taxa de apenas 4% - Dinheiro cai na hora
   ```

5. **CTA Button:** (Large, purple, center)
   ```
   Começar Agora - É Grátis
   ```

### How It Works Section
**Layout:** 3 columns on desktop, stacked on mobile

**Column 1:**
- Icon: QR Code symbol
- Heading: "1. Crie seu QR Code"
- Text: "Cadastre-se em 2 minutos e conecte sua conta Stripe"

**Column 2:**
- Icon: Phone/Camera symbol
- Heading: "2. Cliente Escaneia"
- Text: "Cliente aponta a câmera para o QR Code ou digita seu número"

**Column 3:**
- Icon: Money/Bank symbol
- Heading: "3. Receba na Hora"
- Text: "Dinheiro cai direto na sua conta com taxa de apenas 4%"

### Features Section
**Layout:** 2 columns, alternating image/text

**Feature 1:**
- Heading: "Aceite Qualquer Forma de Pagamento"
- Text: "Cartão de crédito, Pix, Apple Pay, Google Pay - tudo em um só lugar"
- Image: Payment methods icons

**Feature 2:**
- Heading: "Recibos Automáticos em PDF"
- Text: "Cada pagamento gera um recibo profissional automaticamente"
- Image: Receipt preview

**Feature 3:**
- Heading: "Sem Mensalidade, Sem Surpresas"
- Text: "Você só paga quando vende. Taxa fixa de 4% por transação."
- Image: Transparent pricing graphic

### Pricing Section
**Layout:** Single centered card

**Card Content:**
- Heading: "Preço Justo e Transparente"
- Big Number: "4%" (large, purple)
- Text: "por transação"
- Subtext: "Sem mensalidade • Sem taxas escondidas • Sem surpresas"
- Small print: "O valor cai direto na sua conta bancária, conectado ao Stripe"

### Footer
**Layout:** 3 columns

**Column 1:**
- AmoPagar logo
- Tagline: "Pagamentos simples para vendedores brasileiros"

**Column 2:**
- Links:
  - Como Funciona
  - Preços
  - Ajuda
  - Contato

**Column 3:**
- Links:
  - Termos de Uso
  - Política de Privacidade
  - LGPD

---

## 📱 PAGE 2: Payment Page (Dynamic per vendor)
**URL:** `/[phoneNumber]` (e.g., `/+5511999999999`)

### Header
**Elements:**
- AmoPagar logo (top left, links to homepage)
- User menu (top right):
  - If logged in: Profile icon → Dropdown (Dashboard, Sair)
  - If not logged in: "Acessar Conta" | "Criar Conta"

### Vendor Info Card
**Layout:** Centered card at top

**Elements:**
1. **Vendor Avatar:** Circular photo (80x80px)
   - Fallback: Generic avatar if no photo
2. **Vendor Name:** Bold, 24px
   - Format: "João Silva"
3. **Vendor Type:** Small text below name
   - Example: "Motorista" or "Vendedor"
4. **Rating (future):** Star rating placeholder
5. **Phone Number:** Small text
   - Format: "(11) 99999-9999"

### Step 1: Amount Input
**Layout:** Centered, large input field

**Elements:**
1. **Label:** "Quanto você vai pagar?"
2. **Amount Display:** (Large, purple, bold)
   - Format: "R$ 0,00"
   - Updates in real-time as user types
3. **Input Field:**
   - Number pad on mobile
   - Placeholder: "Digite o valor"
   - Auto-formats to Brazilian Real (R$ 1.234,56)
4. **Helper Text:**
   - "Digite apenas números. Ex: 1000 = R$ 10,00"

### Step 2: Payment Method Selection
**Appears when:** Amount >= R$ 1,00

**Layout:** 2 large buttons side by side

**Button 1: Cartão / Apple Pay**
- Icon: Credit card symbol
- Text: "Cartão / Apple Pay"
- Subtext: "Crédito, débito ou Apple Pay"
- Color: Purple border, white background
- Hover: Purple background, white text

**Button 2: Pix**
- Icon: Pix logo (green)
- Text: "Pix"
- Subtext: "Transferência instantânea"
- Color: Green border, white background
- Hover: Green background, white text

### Step 3A: Card Payment (if Cartão selected)
**Layout:** Stripe Elements embedded form

**Elements:**
1. **Card Number Field:**
   - Label: "Número do Cartão"
   - Placeholder: "1234 5678 9012 3456"
   - Icons: Visa, Mastercard, Amex auto-detected

2. **Expiry Date Field:**
   - Label: "Validade"
   - Placeholder: "MM/AA"

3. **CVC Field:**
   - Label: "CVV"
   - Placeholder: "123"

4. **Submit Button:** (Large, purple, full-width)
   - Text: "Pagar R$ [valor]"
   - Loading state: "Processando..."
   - Disabled until form valid

5. **Security Badge:**
   - Icon: Lock symbol
   - Text: "Pagamento processado com segurança via Stripe"
   - Small, gray, centered

6. **Back Button:**
   - Text: "← Voltar"
   - Top left, small, gray

### Step 3B: Pix Payment (if Pix selected)
**Layout:** Centered card

**Elements:**
1. **QR Code:** (Large, 256x256px)
   - Centered
   - Border: Purple, 2px
   - Background: White

2. **Pix Code:** (Below QR)
   - Text field with code
   - Read-only
   - Monospace font
   - Example: "00020126580014BR.GOV.BCB.PIX..."

3. **Copy Button:** (Below code)
   - Icon: Copy symbol
   - Text: "Copiar Código Pix"
   - Color: Green
   - On click: Shows "Copiado!" for 2 seconds

4. **Instructions:** (Below button)
   - Heading: "Como pagar com Pix:"
   - Steps:
     1. Abra o app do seu banco
     2. Escolha pagar com Pix QR Code ou Pix Copia e Cola
     3. Escaneie o QR Code ou cole o código
     4. Confirme o pagamento

5. **Timer:** (Top right of card)
   - Format: "9:45"
   - Color: Orange when < 3 minutes
   - Text: "Código expira em:"

6. **Status Indicator:**
   - Text: "⏳ Aguardando pagamento..."
   - Auto-updates every 2 seconds
   - Changes to: "✅ Pagamento confirmado!" when paid

7. **Back Button:**
   - Text: "← Voltar"
   - Top left

---

## 📱 PAGE 3: Payment Success
**URL:** `/pagamento/sucesso?payment_intent=xxx&amount=1000&vendor=João`

### Success Card
**Layout:** Centered card, max-width 400px

**Elements:**
1. **Success Icon:** (Top, centered)
   - Green circle with checkmark
   - 64x64px

2. **Heading:** (Bold, large)
   ```
   Pagamento Confirmado!
   ```

3. **Subheading:**
   ```
   Seu pagamento foi realizado com sucesso.
   ```

4. **Payment Amount:** (Large, purple, bold)
   - Format: "R$ 10,00"

5. **Vendor Name:** (Gray text)
   - Format: "Para: João Silva"

### Guest User Section (if not logged in)
**Appears:** 1 second after page load

**Elements:**
1. **Info Box:** (Purple background, rounded)
   - Icon: 📱
   - Heading: "Salve seu recibo!"
   - Text: "Crie sua conta em 30 segundos e acesse todos os seus recibos a qualquer momento."

2. **CTA Button:** (Full-width, purple)
   - Text: "Criar Conta Grátis"
   - On click: Opens signup modal

3. **Skip Link:** (Small, gray, centered)
   - Text: "Não, obrigado"

### Authenticated User Section (if logged in)
**Elements:**
1. **Success Message:**
   - Text: "O recibo foi adicionado à sua conta!"

2. **CTA Button:**
   - Text: "Ver Meus Recibos"
   - Links to: `/cliente/dashboard`

### Footer Link
**Element:**
- Text: "Voltar para a página inicial"
- Color: Purple
- Links to: `/`

---

## 📱 PAGE 4: Post-Payment Signup Modal
**Appears:** Auto-popup on success page (guests only)

### Modal Container
**Layout:** Overlay with centered card

**Overlay:**
- Background: Black, 50% opacity
- Blur: Optional backdrop blur

**Card:**
- Max-width: 500px
- Padding: 32px
- Background: White
- Border-radius: 12px
- Shadow: Large

### Close Button
**Element:**
- Icon: ✕ (X symbol)
- Position: Top right of card
- Color: Gray
- Size: 24x24px

### Step 1: Prompt
**Elements:**
1. **Success Icon:** (Green circle, checkmark, 64px)

2. **Heading:**
   ```
   Pagamento Confirmado!
   ```

3. **Amount Display:**
   - Format: "R$ 10,00 para João Silva"
   - Color: Purple

4. **Info Box:** (Blue background)
   - Icon: 📱
   - Heading: "Salve este recibo!"
   - Text: "Crie sua conta em 30 segundos e acesse todos os seus recibos a qualquer momento."

5. **CTA Button:** (Full-width, purple)
   - Text: "Criar Conta Grátis"

6. **Skip Button:** (Text only, gray)
   - Text: "Não, obrigado"

### Step 2: Phone Entry
**Elements:**
1. **Heading:**
   ```
   Criar Conta
   ```

2. **Subheading:**
   ```
   Insira seu número de celular para começar
   ```

3. **Phone Input:**
   - Label: "Celular (com DDD)"
   - Placeholder: "(11) 99999-9999"
   - Icon: Phone symbol (left)
   - Auto-formats as user types
   - Max length: 15 characters

4. **Error Message:** (if invalid)
   - Text: "Por favor, insira um número válido com DDD"
   - Color: Red
   - Icon: Error symbol

5. **Submit Button:** (Full-width, purple)
   - Text: "Enviar Código"
   - Disabled when: phone < 11 digits
   - Loading state: "Enviando..."

6. **Back Button:** (Text only)
   - Text: "Voltar"

### Step 3: OTP Verification
**Elements:**
1. **Heading:**
   ```
   Verificar Código
   ```

2. **Subheading:**
   ```
   Digite o código de 6 dígitos enviado para (11) 99999-9999
   ```

3. **OTP Input:**
   - Label: "Código de Verificação"
   - Placeholder: "000000"
   - Large text, monospace
   - Center-aligned
   - 6 digits max
   - Auto-focus

4. **Error Message:** (if invalid)
   - Text: "Código inválido ou expirado"
   - Color: Red

5. **Submit Button:** (Full-width, purple)
   - Text: "Verificar e Criar Conta"
   - Disabled when: code < 6 digits
   - Loading state: "Verificando..."

6. **Resend Link:** (Text only, purple)
   - Text: "Reenviar código"
   - Countdown: "Reenviar código (45s)"

7. **Change Phone Link:** (Text only, gray)
   - Text: "Alterar número"

### Step 4: Success
**Elements:**
1. **Success Icon:** (Green circle, checkmark, 64px)

2. **Heading:**
   ```
   Conta Criada!
   ```

3. **Subheading:**
   ```
   Redirecionando para o painel...
   ```

4. **Loading Spinner:** (Purple)

---

## 📱 PAGE 5: Client Dashboard
**URL:** `/cliente/dashboard`

### Header
**Elements:**
1. **AmoPagar Logo:** (Top left)
2. **Page Title:** "Painel do Cliente"
3. **User Menu:** (Top right)
   - Avatar/Icon
   - Dropdown:
     - Nome: "Olá, [Nome]"
     - Dashboard
     - Configurações
     - Sair

### Greeting Section
**Elements:**
1. **Heading:**
   ```
   Olá, [Nome]!
   ```
2. **Subheading:**
   ```
   Gerencie seus pagamentos e recibos
   ```

### Summary Cards
**Layout:** 3 cards in a row (stack on mobile)

**Card 1: Total Gasto**
- Icon: 💰
- Label: "Total Gasto"
- Value: "R$ 1.234,56" (Large, bold, purple)

**Card 2: Pagamentos**
- Icon: 📊
- Label: "Pagamentos"
- Value: "15" (Large, bold, gray)

**Card 3: Este Mês**
- Icon: 📅
- Label: "Este Mês"
- Value: "R$ 345,67" (Large, bold, green)

### Filters Section
**Layout:** Card with 3 input fields

**Heading:** "Filtros"

**Field 1: Search**
- Icon: 🔍 (Search symbol)
- Label: "Buscar por vendedor"
- Placeholder: "Nome do vendedor..."
- Type: Text input

**Field 2: Start Date**
- Label: "Data Inicial"
- Type: Date picker
- Placeholder: "DD/MM/YYYY"

**Field 3: End Date**
- Label: "Data Final"
- Type: Date picker
- Placeholder: "DD/MM/YYYY"

**Clear Filters Button:**
- Text: "Limpar filtros"
- Color: Purple (text only)
- Appears when: any filter is active

### Payments Table
**Layout:** Responsive table

**Heading:** "Seus Pagamentos"
**Subheading:** "Ver todos →" (link, right-aligned)

**Columns:**
1. **Data**
   - Format: "22/11/2025"
   - Sort: Descending by default

2. **Valor**
   - Format: "R$ 10,00"
   - Bold

3. **Vendedor**
   - Format: "João Silva"

4. **Método**
   - Values: "Cartão", "Pix", "Apple Pay"
   - Icon + Text

5. **Recibo**
   - Format: "#PIX-1234567890-ABC123"
   - Monospace font
   - Small

6. **Ações**
   - Download button
   - Icon: Download symbol
   - Text: "Baixar"
   - Color: Purple

**Empty State:** (when no payments)
- Icon: Empty box
- Text: "Nenhum pagamento encontrado"
- CTA: "Fazer um pagamento" → Links to `/`

**Mobile View:**
- Table converts to cards
- Each payment = 1 card
- Shows all info stacked

### Manual Invoice Section
**Layout:** Info card with CTA

**Background:** Light blue
**Border:** Blue

**Elements:**
1. **Heading:**
   ```
   Pagou sem estar logado?
   ```

2. **Text:**
   ```
   Adicione manualmente o comprovante usando o número do recibo
   ```

3. **CTA Button:** (Blue)
   - Icon: + (Plus symbol)
   - Text: "Adicionar Comprovante"
   - Links to: `/cliente/dashboard/add-invoice`

---

## 📱 PAGE 6: Manual Invoice Entry
**URL:** `/cliente/dashboard/add-invoice`

### Header
**Elements:**
1. **Back Button:** (Top left)
   - Icon: ← (Arrow left)
   - Text: "Voltar ao painel"
   - Links to: `/cliente/dashboard`

### Main Content Card

### Heading Section
**Elements:**
1. **Page Title:**
   ```
   Adicionar Comprovante
   ```

2. **Description:**
   ```
   Digite o número do recibo para vincular o pagamento à sua conta
   ```

### Info Box
**Background:** Light blue
**Border:** Blue

**Elements:**
1. **Icon:** 📸

2. **Heading:**
   ```
   Como encontrar o número do recibo?
   ```

3. **Instructions:** (Bulleted list)
   - Abra o print/screenshot do comprovante de pagamento
   - O número está no formato: **PIX-1234567890-ABC123**
   - Pode aparecer como "Número do Recibo" ou "Invoice Number"
   - Digite exatamente como aparece no comprovante

### Input Section
**Elements:**
1. **Label:**
   ```
   Número do Recibo
   ```

2. **Input Field:**
   - Icon: 🔍 (Search, left side)
   - Placeholder: "PIX-1234567890-ABC123"
   - Font: Monospace
   - Auto-uppercase
   - Full-width

3. **Helper Text:**
   ```
   Digite o número exatamente como aparece no comprovante
   ```

### Error Display (if error)
**Elements:**
- Background: Light red
- Border: Red
- Icon: ✕ (Error symbol)
- Heading: "Erro ao adicionar comprovante"
- Message: [Error text from API]

### Submit Button
**Elements:**
- Text: "Adicionar Comprovante"
- Color: Purple
- Full-width
- Disabled when: input empty
- Loading state: "Processando..."

### Success State (after successful link)
**Replaces entire form with:**

**Elements:**
1. **Success Icon:** (Green circle, checkmark, 64px)

2. **Heading:**
   ```
   Comprovante Adicionado!
   ```

3. **Description:**
   ```
   O pagamento foi vinculado à sua conta com sucesso.
   ```

4. **Payment Details Card:**
   - Background: Light gray
   - Border: Gray
   - Grid layout: 2 columns

   **Field 1: Valor**
   - Label: "Valor"
   - Value: "R$ 10,00"

   **Field 2: Data**
   - Label: "Data"
   - Value: "22/11/2025"

   **Field 3: Vendedor** (full width)
   - Label: "Vendedor"
   - Value: "João Silva"

   **Field 4: Recibo** (full width)
   - Label: "Recibo"
   - Value: "#PIX-1234567890-ABC123"
   - Font: Monospace
   - Color: Purple

5. **Status Text:**
   ```
   Redirecionando para o painel...
   ```

### Help Section (FAQ)
**Layout:** Accordion (expandable sections)

**Section 1:**
- **Question:** "Comprovante não encontrado"
- **Answer:** Verifique se digitou o número corretamente. O número diferencia maiúsculas de minúsculas. Tente copiar e colar diretamente do comprovante.

**Section 2:**
- **Question:** "Comprovante já vinculado"
- **Answer:** Este comprovante já está vinculado a uma conta. Verifique se você já adicionou este pagamento anteriormente ou se foi adicionado durante o pagamento.

**Section 3:**
- **Question:** "Não consigo encontrar o número"
- **Answer:** O número do recibo aparece no comprovante de pagamento que você recebeu após pagar. Se você não tem o comprovante, entre em contato com o vendedor.

---

## 📱 PAGE 7: Driver Registration
**URL:** `/motorista/cadastro`

### Header
**Elements:**
1. **AmoPagar Logo:** (Top left, links to `/`)
2. **Already Registered Link:** (Top right)
   - Text: "Já tem conta? Entrar"
   - Links to: `/login`

### Main Form Card

### Heading Section
**Elements:**
1. **Page Title:**
   ```
   Cadastro de Motorista/Vendedor
   ```

2. **Description:**
   ```
   Preencha os dados abaixo para começar a receber pagamentos
   ```

### Form Fields
**Layout:** Single column, stacked fields

**Field 1: Nome Completo**
- Label: "Nome Completo"
- Placeholder: "João Silva Santos"
- Type: Text
- Required: Yes
- Validation: Min 3 characters

**Field 2: Email**
- Label: "Email"
- Placeholder: "joao@email.com"
- Type: Email
- Required: Yes
- Validation: Valid email format

**Field 3: Celular**
- Label: "Celular (com DDD)"
- Placeholder: "(11) 99999-9999"
- Type: Tel
- Required: Yes
- Auto-format: Yes
- Validation: 11 digits

**Field 4: CPF**
- Label: "CPF"
- Placeholder: "123.456.789-00"
- Type: Text
- Required: Yes
- Auto-format: Yes (xxx.xxx.xxx-xx)
- Validation: Valid CPF algorithm
- Error message: "CPF inválido"

**Field 5: Profissão**
- Label: "Profissão"
- Placeholder: "Ex: Motorista de Uber, Vendedor Ambulante"
- Type: Text
- Required: Yes

**Field 6: Data de Nascimento**
- Label: "Data de Nascimento"
- Type: Date picker
- Required: Yes
- Validation: Must be 18+ years old

**Field 7: Selfie (Future)**
- Label: "Foto de Identificação"
- Type: File upload
- Accepts: Image only
- Optional: For now
- Button: "Tirar Foto" or "Escolher Arquivo"

### Terms Checkbox
**Elements:**
- Checkbox
- Text: "Li e concordo com os Termos de Uso e Política de Privacidade"
- Links: "Termos de Uso" and "Política de Privacidade" open in new tab

### Submit Button
**Elements:**
- Text: "Criar Conta e Conectar Stripe"
- Color: Purple
- Full-width
- Large
- Disabled when: form invalid or terms not accepted
- Loading state: "Criando conta..."

### Info Box (Below button)
**Background:** Light blue
**Elements:**
- Icon: ℹ️
- Text: "Após criar sua conta, você será redirecionado para o Stripe para conectar sua conta bancária. Isso leva apenas 2 minutos."

---

## 📱 PAGE 8: Login
**URL:** `/login`

### Header
**Elements:**
1. **AmoPagar Logo:** (Centered)
2. **Subheading:**
   ```
   Entre na sua conta AmoPagar
   ```

### Login Card
**Layout:** Centered, max-width 400px

### Phone Login (Primary method)
**Elements:**
1. **Heading:**
   ```
   Login com Celular
   ```

2. **Phone Input:**
   - Label: "Número de Celular"
   - Placeholder: "(11) 99999-9999"
   - Icon: Phone symbol
   - Auto-format: Yes

3. **Submit Button:**
   - Text: "Enviar Código"
   - Color: Purple
   - Full-width

4. **Info Text:**
   ```
   Enviaremos um código de verificação via SMS
   ```

### OTP Verification (After sending code)
**Elements:**
1. **Heading:**
   ```
   Digite o Código
   ```

2. **Subheading:**
   ```
   Código enviado para (11) 99999-9999
   ```

3. **OTP Input:**
   - 6 digits
   - Large, monospace
   - Center-aligned

4. **Verify Button:**
   - Text: "Entrar"
   - Color: Purple
   - Full-width

5. **Resend Link:**
   - Text: "Reenviar código (30s)"
   - Color: Purple (text only)

### Signup Link
**Elements:**
- Text: "Não tem conta? Cadastre-se"
- Links to: `/cadastro` or `/motorista/cadastro`

---

## 📱 PAGE 9: Driver Dashboard
**URL:** `/motorista/dashboard`

### Header
**Elements:**
1. **AmoPagar Logo:** (Top left)
2. **User Menu:** (Top right)
   - Avatar
   - Dropdown:
     - Nome: "Olá, [Nome]"
     - Meu QR Code
     - Configurações
     - Sair

### Tabs Navigation
**Elements:**
- Pagamentos (Active by default)
- Configurações
- Ajuda

### Tab 1: Pagamentos (Overview)

#### Stripe Connection Status
**If not connected:**
- Card: Warning (yellow background)
- Icon: ⚠️
- Heading: "Conecte sua conta Stripe"
- Text: "Você precisa conectar sua conta bancária para receber pagamentos"
- Button: "Conectar Stripe Agora" (Yellow)

**If connected:**
- Card: Success (green background)
- Icon: ✓
- Text: "Conta conectada: [banco]"
- Button: "Gerenciar no Stripe" (Small, secondary)

#### QR Code Section
**Elements:**
1. **Heading:**
   ```
   Seu QR Code de Pagamento
   ```

2. **QR Code Display:**
   - Large QR code (300x300px)
   - Contains: `https://amopagar.com/+5511999999999`
   - Border: Purple

3. **Your Link:**
   - Label: "Ou compartilhe seu link:"
   - Link: `https://amopagar.com/+5511999999999`
   - Copy button next to it

4. **Share Buttons:**
   - WhatsApp
   - Email
   - Download QR Code (PNG)

#### Stats Cards
**Layout:** 4 cards in a row

**Card 1: Hoje**
- Value: "R$ 250,00"
- Label: "Recebido hoje"

**Card 2: Esta Semana**
- Value: "R$ 1.450,00"
- Label: "Esta semana"

**Card 3: Este Mês**
- Value: "R$ 6.780,00"
- Label: "Este mês"

**Card 4: Total Transações**
- Value: "42"
- Label: "Transações este mês"

#### Recent Payments Table
**Layout:** Same as client dashboard

**Columns:**
1. Data
2. Cliente (if registered) or "Convidado"
3. Valor
4. Método
5. Status (Pago, Pendente, Falhou)
6. Ações (Ver recibo)

### Tab 2: Configurações

#### Profile Section
**Fields:**
- Nome
- Email (read-only)
- Celular (read-only)
- CPF (read-only)
- Profissão
- Avatar (upload)

**Button:** "Salvar Alterações"

#### Stripe Section
**Elements:**
- Status: Conectado/Desconectado
- Account ID: acct_xxxxx
- Button: "Abrir Dashboard Stripe"
- Button: "Desconectar" (danger, small)

---

## 🎨 UI Components Library

### Buttons

**Primary Button:**
- Background: Purple (#7C3AED)
- Text: White
- Border-radius: 8px
- Padding: 12px 24px
- Font-weight: 600
- Hover: Darker purple (#6D28D9)
- Disabled: Gray, 50% opacity

**Secondary Button:**
- Background: White
- Text: Purple
- Border: 2px purple
- Rest same as primary

**Danger Button:**
- Background: Red (#EF4444)
- Text: White
- Rest same as primary

### Input Fields

**Text Input:**
- Height: 48px
- Border: 1px gray (#D1D5DB)
- Border-radius: 8px
- Padding: 12px 16px
- Font-size: 16px
- Focus: Purple border, purple ring

**Date Picker:**
- Same as text input
- Calendar icon on right
- Opens date selector

**Search Input:**
- Same as text input
- Search icon on left
- Padding-left: 40px (for icon)

### Cards

**Standard Card:**
- Background: White
- Border-radius: 12px
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Padding: 24px

**Info Card:**
- Same as standard
- Blue background (#EFF6FF)
- Blue border (#3B82F6)

**Success Card:**
- Green background (#F0FDF4)
- Green border (#10B981)

**Warning Card:**
- Yellow background (#FFFBEB)
- Yellow border (#F59E0B)

**Error Card:**
- Red background (#FEF2F2)
- Red border (#EF4444)

### Icons

**Source:** Lucide React (already in project)

**Common Icons:**
- CreditCard
- QrCode
- Phone
- Download
- Search
- User
- LogOut
- ArrowLeft
- CheckCircle
- XCircle
- Loader2 (spinner)
- Plus
- Trash2

---

## 📱 Responsive Breakpoints

**Mobile:** < 768px
- Stack all columns
- Full-width cards
- Bottom navigation
- Hamburger menu

**Tablet:** 768px - 1024px
- 2 column grids
- Side navigation

**Desktop:** > 1024px
- Full multi-column layouts
- Side navigation always visible

---

## 🔔 Notifications & Toasts

**Toast Position:** Top-right corner

**Success Toast:**
- Background: Green
- Icon: ✓
- Text: White
- Duration: 3 seconds
- Example: "Pagamento confirmado!"

**Error Toast:**
- Background: Red
- Icon: ✕
- Text: White
- Duration: 5 seconds
- Example: "Erro ao processar pagamento"

**Info Toast:**
- Background: Blue
- Icon: ℹ️
- Duration: 4 seconds
- Example: "Código copiado!"

---

## ⚡ Loading States

**Page Loading:**
- Full-screen overlay
- Centered spinner (purple)
- Text: "Carregando..."

**Button Loading:**
- Spinner inside button (left of text)
- Text changes: "Processando..."
- Button disabled

**Skeleton Loading:**
- Gray animated placeholders
- Use for: Cards, tables, text

---

## 🎯 Empty States

**No Payments:**
- Icon: Empty box
- Heading: "Nenhum pagamento ainda"
- Text: "Você ainda não recebeu pagamentos"
- CTA: "Compartilhar meu QR Code"

**No Results (filtered):**
- Icon: Search
- Heading: "Nenhum resultado encontrado"
- Text: "Tente ajustar os filtros"
- Button: "Limpar filtros"

**Error State:**
- Icon: Error symbol
- Heading: "Algo deu errado"
- Text: [Error message]
- Button: "Tentar novamente"

---

This is the complete design specification for all pages in AmoPagar. Use this to create your designs in any page builder (Figma, Webflow, Framer, etc.)!
