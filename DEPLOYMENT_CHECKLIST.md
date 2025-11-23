# AmoPagar Deployment Checklist

## Pre-Deployment

### 1. Code Review ✅
- [x] All authentication fixes verified
- [x] No console errors in browser
- [x] No TypeScript errors
- [x] No ESLint warnings (critical ones)
- [x] Code follows consistent patterns
- [x] All TODOs addressed or documented

### 2. Environment Variables 🔑
**Local Development** (.env.local):
- [x] NEXT_PUBLIC_SUPABASE_URL
- [x] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [x] SUPABASE_SERVICE_ROLE_KEY
- [x] NEXTAUTH_SECRET
- [x] NEXTAUTH_URL=http://localhost:3000
- [x] STRIPE_SECRET_KEY (test mode)
- [x] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (test mode)
- [ ] GOOGLE_CLIENT_ID (optional)
- [ ] GOOGLE_CLIENT_SECRET (optional)

**Vercel Production**:
- [ ] NEXT_PUBLIC_SUPABASE_URL (production URL)
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY (production key)
- [ ] SUPABASE_SERVICE_ROLE_KEY (production key)
- [ ] NEXTAUTH_SECRET (new secret for production)
- [ ] NEXTAUTH_URL=https://your-domain.vercel.app
- [ ] STRIPE_SECRET_KEY (live mode)
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (live mode)
- [ ] GOOGLE_CLIENT_ID (production OAuth)
- [ ] GOOGLE_CLIENT_SECRET (production OAuth)

**Generate Production Secrets**:
```bash
# NextAuth secret
openssl rand -base64 32

# Store in Vercel:
vercel env add NEXTAUTH_SECRET
```

### 3. Supabase Configuration 🗄️
**Database**:
- [ ] Production project created
- [ ] All tables created (profiles, verification_codes, pagamentos)
- [ ] Indexes created for performance
- [ ] RLS policies enabled and tested
- [ ] Database triggers working (handle_new_user)
- [ ] Functions deployed (check_sms_rate_limit_phone)

**Authentication**:
- [ ] Email auth enabled
- [ ] Phone auth enabled
- [ ] Email templates customized
- [ ] SMS provider configured (Twilio/MessageBird/etc)
- [ ] Rate limiting configured
- [ ] Redirect URLs added:
  - [ ] https://your-domain.vercel.app/auth/callback
  - [ ] https://your-domain.vercel.app/api/auth/callback/google

**Storage**:
- [ ] Bucket 'selfies' created
- [ ] Bucket 'avatars' created
- [ ] Public/private policies set correctly
- [ ] File size limits configured

**Test Supabase Connection**:
```bash
# In browser console on deployed site
console.log(window.location.href, 'Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

### 4. Stripe Configuration 💳
**Connect Account**:
- [ ] Stripe Connect application created
- [ ] Express accounts enabled
- [ ] Brazil region enabled
- [ ] Payout schedule configured
- [ ] Platform fees configured (10%)

**Webhooks**:
- [ ] Webhook endpoint created
- [ ] Endpoint URL: https://your-domain.vercel.app/api/webhooks/stripe
- [ ] Events subscribed:
  - [ ] account.updated
  - [ ] payment_intent.succeeded
  - [ ] payment_intent.failed

**OAuth Redirects**:
- [ ] Added: https://your-domain.vercel.app/api/stripe/oauth/callback

**Test Stripe**:
```bash
# Use Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 5. Google OAuth (Optional) 🔐
- [ ] OAuth 2.0 credentials created
- [ ] Authorized JavaScript origins:
  - [ ] https://your-domain.vercel.app
- [ ] Authorized redirect URIs:
  - [ ] https://your-domain.vercel.app/api/auth/callback/google

### 6. Domain & DNS 🌐
- [ ] Custom domain purchased (optional)
- [ ] DNS configured in Vercel
- [ ] SSL certificate provisioned
- [ ] HTTPS enforced

---

## Testing (Pre-Deployment)

### 7. Local Testing 🧪
Run all tests from TESTING_GUIDE.md:

**Driver Flow**:
- [ ] Test 1.1: New driver OTP signup
- [ ] Test 1.2: Existing driver login
- [ ] Test 1.3: Driver email login
- [ ] Test 1.4: Phone validation
- [ ] Test 1.5: Rate limiting

**Client Flow**:
- [ ] Test 2.1: Email signup
- [ ] Test 2.2: Email login
- [ ] Test 2.3: Google OAuth signup (if enabled)
- [ ] Test 2.4: Google OAuth login (if enabled)
- [ ] Test 2.5: Duplicate email handling

**Security**:
- [ ] Test 3.1: Session expiration
- [ ] Test 3.2: Cross-role access prevention
- [ ] Test 3.3: Unauthenticated access prevention
- [ ] Test 3.4: Password strength validation

**Quick Smoke Test**:
```bash
# Test OTP endpoint
curl -X POST http://localhost:3000/api/auth/send-verification \
  -H "Content-Type: application/json" \
  -d '{"phone": "11999999999", "countryCode": "55"}'

# Should return: {"success": true}
```

### 8. Build Verification 🏗️
```bash
# Clean build
rm -rf .next
npm run build

# Check for errors
# Should complete without errors
# Should show all routes generated

# Test production build locally
npm run start
# Visit http://localhost:3000
# Test critical flows
```

**Build Checklist**:
- [ ] No TypeScript errors
- [ ] No build warnings (critical ones)
- [ ] All routes pre-rendered correctly
- [ ] Environment variables loaded
- [ ] Static assets optimized

---

## Deployment

### 9. Vercel Setup 🚀
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Set environment variables
# (Use Vercel dashboard or CLI)
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... add all vars

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Vercel Settings**:
- [ ] Framework Preset: Next.js
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.next`
- [ ] Install Command: `npm install`
- [ ] Node.js Version: 18.x or higher
- [ ] Environment Variables: All set

### 10. First Deploy - Preview 👀
```bash
vercel
```

**After Preview Deploy**:
- [ ] Visit preview URL
- [ ] Check homepage loads
- [ ] Check all navigation links work
- [ ] Test driver OTP flow
- [ ] Test client signup flow
- [ ] Check browser console for errors
- [ ] Test on mobile device
- [ ] Verify environment variables loaded

**If Preview Looks Good**:
```bash
vercel --prod
```

### 11. Production Deploy - Monitoring 📊
**First Hour After Deploy**:
- [ ] Visit production URL
- [ ] Complete full driver signup
- [ ] Complete full client signup
- [ ] Make test payment
- [ ] Check database for new records
- [ ] Monitor Vercel logs for errors
- [ ] Monitor Supabase logs
- [ ] Check error rate in Vercel Analytics

**Vercel Logs**:
```bash
# Real-time logs
vercel logs --follow

# Or in dashboard
# https://vercel.com/[your-account]/[project]/logs
```

---

## Post-Deployment

### 12. Smoke Tests (Production) ✅
Run critical path tests on production:

**Driver Path**:
1. [ ] Go to /motorista/login
2. [ ] Enter real phone number
3. [ ] Receive OTP within 10 seconds
4. [ ] Complete signup successfully
5. [ ] Access dashboard

**Client Path**:
1. [ ] Go to /cadastro
2. [ ] Signup with real email
3. [ ] Receive verification email
4. [ ] Click link, redirected correctly
5. [ ] Login successfully
6. [ ] Access dashboard

**Google OAuth** (if enabled):
1. [ ] Click Google button
2. [ ] Authorize with real Google account
3. [ ] Redirected to dashboard
4. [ ] Profile created correctly

### 13. Performance Check ⚡
**Core Web Vitals**:
```bash
# Use Lighthouse
npx lighthouse https://your-domain.vercel.app --view

# Or use PageSpeed Insights
# https://pagespeed.web.dev/
```

**Target Scores**:
- [ ] Performance: >90
- [ ] Accessibility: >90
- [ ] Best Practices: >90
- [ ] SEO: >80

**Load Times**:
- [ ] Homepage: <2s
- [ ] Login page: <1.5s
- [ ] Dashboard: <2s
- [ ] API responses: <500ms

### 14. Security Scan 🔒
**Headers Check**:
```bash
curl -I https://your-domain.vercel.app
```

**Should include**:
- [ ] Strict-Transport-Security
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] X-XSS-Protection: 1; mode=block

**SSL Check**:
```bash
# Visit in browser
# Check for HTTPS padlock icon
# Certificate should be valid
```

**Environment Variables**:
- [ ] No secrets in client-side code
- [ ] No API keys in browser console
- [ ] No sensitive data in URLs

### 15. Monitoring Setup 📈
**Error Tracking**:
- [ ] Sentry configured (recommended)
  ```bash
  npm install @sentry/nextjs
  npx @sentry/wizard -i nextjs
  ```
- [ ] Error alerts enabled
- [ ] Performance monitoring enabled

**Analytics**:
- [ ] Vercel Analytics enabled
- [ ] Google Analytics configured (optional)
- [ ] Conversion tracking setup

**Uptime Monitoring**:
- [ ] UptimeRobot configured (free)
- [ ] Alert email set
- [ ] Check interval: 5 minutes

**Database Monitoring**:
- [ ] Supabase alerts configured
- [ ] Database size monitored
- [ ] Query performance tracked

---

## Rollback Plan

### 16. If Issues Arise 🚨
**Immediate Rollback**:
```bash
# In Vercel dashboard
# Deployments → Previous deployment → Promote to Production

# Or via CLI
vercel rollback
```

**Diagnose Issues**:
```bash
# Check logs
vercel logs --follow

# Check specific deployment
vercel logs [deployment-url]
```

**Common Issues**:

**Issue: Env vars not loading**
```bash
# Verify in Vercel dashboard
# Environment Variables → Check all are set
# Redeploy after fixing
```

**Issue: Database connection fails**
```bash
# Check Supabase URL is production URL
# Check service role key is correct
# Test connection from Vercel function:
# /api/test-db
```

**Issue: Authentication not working**
```bash
# Check NEXTAUTH_URL matches deployment
# Check NEXTAUTH_SECRET is set
# Check callback URLs in providers
```

---

## Success Metrics

### 17. Day 1 Metrics 📊
**Track these for first 24 hours**:
- [ ] Deployment successful: YES/NO
- [ ] Homepage loads: YES/NO
- [ ] Auth success rate: ___% (target: >95%)
- [ ] Error rate: ___% (target: <1%)
- [ ] Avg response time: ___ms (target: <500ms)
- [ ] User signups: ___ (track conversion)
- [ ] Support tickets: ___ (target: minimal)

**If Metrics Look Good** ✅:
- Deployment successful!
- Monitor for 48 more hours
- Gather user feedback

**If Metrics Look Bad** ❌:
- Investigate logs immediately
- Check specific error patterns
- Consider rollback if critical
- Fix and redeploy

---

## Week 1 Checklist

### 18. Ongoing Monitoring 👁️
**Daily** (First Week):
- [ ] Check error logs
- [ ] Review authentication success rates
- [ ] Monitor database usage
- [ ] Check API response times
- [ ] Review user feedback

**Weekly**:
- [ ] Analyze conversion rates
- [ ] Review support tickets
- [ ] Check database growth
- [ ] Optimize slow queries
- [ ] Update documentation if needed

---

## Completion

### 19. Final Sign-Off ✍️
**Deployment Complete**:
- [ ] All checklist items completed
- [ ] All tests passing
- [ ] Monitoring configured
- [ ] Team notified
- [ ] Documentation updated
- [ ] Rollback plan documented

**Sign-Off**:
```
Deployed By: _______________
Date: _______________
Version: 2.0.0
Status: ✅ Production Ready
Confidence: 95%

Notes:
_________________________________
_________________________________
_________________________________
```

---

## Quick Reference

### Useful Commands
```bash
# Deploy to production
vercel --prod

# View logs
vercel logs --follow

# Rollback
vercel rollback

# Check deployment status
vercel ls

# Test locally with production build
npm run build && npm run start
```

### Useful URLs
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://app.supabase.com
- Stripe Dashboard: https://dashboard.stripe.com
- Google Console: https://console.cloud.google.com

### Emergency Contacts
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Stripe Support: https://support.stripe.com

---

**Good luck with your deployment! 🚀**

**Remember**:
- Take it step by step
- Test thoroughly before going live
- Monitor closely after deploy
- Don't panic if issues arise - you have a rollback plan
- Document any issues for future reference

**You've got this!** 💪

---

**Document Version**: 1.0
**Last Updated**: 2025-11-23
**Status**: Ready for Use ✅
