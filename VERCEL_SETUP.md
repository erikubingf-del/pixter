# 🚀 Vercel Deployment Setup Guide

## Environment Variables for Vercel

### Option 1: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI if you haven't already
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables (run these commands one by one)
# Copy values from your .env.local file
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
vercel env add STRIPE_WEBHOOK_SECRET
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add TWILIO_PHONE_NUMBER
vercel env add NEXT_PUBLIC_APP_URL

# For each variable, when prompted:
# 1. Paste the value from your .env.local file
# 2. Select: Production, Preview, Development
```

### Option 2: Using Vercel Dashboard (Manual)

1. Go to your project on Vercel: https://vercel.com/dashboard
2. Click on your project: **pixter**
3. Go to **Settings** → **Environment Variables**
4. Add each variable below (click "Add" for each one):

| Variable Name | Value (from .env.local) | Environment |
|--------------|-------------------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Copy from `.env.local` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Copy from `.env.local` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Copy from `.env.local` | Production, Preview, Development |
| `STRIPE_SECRET_KEY` | Copy from `.env.local` | Production, Preview, Development |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Copy from `.env.local` | Production, Preview, Development |
| `STRIPE_WEBHOOK_SECRET` | Copy from `.env.local` | Production, Preview, Development |
| `NEXTAUTH_SECRET` | Copy from `.env.local` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://pixter-mu.vercel.app` | Production, Preview, Development |
| `GOOGLE_CLIENT_ID` | Copy from `.env.local` | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | Copy from `.env.local` | Production, Preview, Development |
| `TWILIO_ACCOUNT_SID` | Copy from `.env.local` | Production, Preview, Development |
| `TWILIO_AUTH_TOKEN` | Copy from `.env.local` | Production, Preview, Development |
| `TWILIO_PHONE_NUMBER` | Copy from `.env.local` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://pixter-mu.vercel.app` | Production, Preview, Development |

**Note:** Get all values from your local `.env.local` file. Only `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` need to be changed to your production domain.

## 🔄 After Adding Environment Variables

1. **Redeploy your project:**
   ```bash
   vercel --prod
   ```

   Or trigger a new deployment from the Vercel Dashboard:
   - Go to **Deployments** → Click **Redeploy** on the latest deployment

2. **Verify the build succeeds:**
   - Check the deployment logs for any errors
   - The build should complete without "Missing environment variables" errors

## 📋 Post-Deployment Checklist

- [ ] All environment variables added to Vercel
- [ ] Deployment successful (no build errors)
- [ ] Test authentication (Google OAuth, email/password)
- [ ] Test Stripe payment flow
- [ ] Test Pix QR code generation
- [ ] Configure Stripe webhook URL: `https://pixter-mu.vercel.app/api/stripe/webhook`
- [ ] Update Google OAuth redirect URIs to include Vercel domain
- [ ] Test Twilio SMS functionality

## 🔐 Security Notes

- ✅ `.env.local` is gitignored and won't be committed
- ✅ Never commit `.env` files with real credentials to git
- ✅ Use `.env.example` for documentation only
- ✅ Rotate secrets regularly, especially after sharing or exposure

## 🐛 Troubleshooting

**Build fails with "Missing environment variables":**
- Verify all variables are set in Vercel Dashboard
- Ensure you selected the correct environments (Production, Preview, Development)
- Redeploy after adding variables

**Stripe webhook not working:**
- Update webhook endpoint in Stripe Dashboard to: `https://pixter-mu.vercel.app/api/stripe/webhook`
- Copy the new webhook secret and update `STRIPE_WEBHOOK_SECRET` in Vercel

**Google OAuth fails:**
- Add `https://pixter-mu.vercel.app` to authorized redirect URIs in Google Console
- Add `https://pixter-mu.vercel.app/api/auth/callback/google` to the list

## 🚀 Production Checklist (When Ready)

- [ ] Switch to Stripe live keys (replace `sk_test_` and `pk_test_`)
- [ ] Generate new production webhook secret in Stripe
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Enable Stripe Radar for fraud protection
- [ ] Set up monitoring and alerts
- [ ] Test payment flow end-to-end in production
