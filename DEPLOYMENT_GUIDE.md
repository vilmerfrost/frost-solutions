# Frost Solutions - Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required for Stripe (AI payments)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Required for AI features
GEMINI_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-api-key

# Required for integrations
FORTNOX_CLIENT_ID=your-fortnox-client-id
FORTNOX_CLIENT_SECRET=your-fortnox-client-secret
VISMA_CLIENT_ID=your-visma-client-id
VISMA_CLIENT_SECRET=your-visma-client-secret

# Application URL (used for OAuth callbacks)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Encryption (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your-32-byte-hex-key
```

### 2. Database Migrations

Run these SQL files in order on your Supabase project:

```bash
# 1. Core schema (if not already run)
psql -f schema.sql

# 2. AI Credits system
psql -f sql/migrations/20260109_ai_credits_system.sql

# 3. Performance indexes
psql -f sql/PERFORMANCE_INDEXES.sql
```

### 3. Stripe Configuration

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create webhook endpoint pointing to: `https://your-domain.com/api/stripe/webhook`
3. Subscribe to events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.succeeded`
   - `charge.refunded`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

### 4. OAuth Configuration

#### Fortnox
1. Go to [Fortnox Developer Portal](https://developer.fortnox.se)
2. Register your application
3. Set callback URL: `https://your-domain.com/api/integrations/callback/fortnox`
4. Note your Client ID and Client Secret

#### Visma
1. Go to [Visma Developer Portal](https://developer.visma.com)
2. Register your application
3. Set callback URL: `https://your-domain.com/api/integrations/callback/visma`
4. Note your Client ID and Client Secret

---

## Deployment Steps

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Set environment variables in Vercel dashboard:
1. Go to Project Settings > Environment Variables
2. Add all variables from `.env.example`

### Option 2: Self-Hosted (Docker)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t frost-solutions .
docker run -p 3000:3000 --env-file .env.local frost-solutions
```

---

## Post-Deployment Verification

### 1. Health Check

```bash
curl https://your-domain.com/api/health
# Should return: { "status": "ok" }
```

### 2. Test Critical Flows

- [ ] User can log in via Supabase Auth
- [ ] Dashboard loads correctly
- [ ] Time entries can be created
- [ ] Invoices can be created and sent
- [ ] Supplier invoices can be uploaded with AI OCR
- [ ] ROT/RUT applications work
- [ ] Payroll export works
- [ ] Fortnox/Visma integration connects
- [ ] AI balance shows correctly
- [ ] Stripe payment modal opens

### 3. Test AI Payment Flow

1. Navigate to any AI feature (supplier invoice upload)
2. Verify balance widget shows
3. If balance is zero, click "Ladda på"
4. Complete test payment (use Stripe test card: 4242 4242 4242 4242)
5. Verify credits are added
6. Use AI feature and verify credits are deducted

### 4. Monitor Logs

Check Vercel logs or your logging service for:
- Server errors (500s)
- Authentication failures
- Stripe webhook failures
- Database connection issues

---

## Troubleshooting

### "Unauthorized" errors
- Check Supabase keys are correct
- Verify RLS policies are enabled
- Check user has valid session

### Stripe webhooks failing
- Verify webhook secret is correct
- Check webhook URL is accessible
- Review Stripe dashboard for failed webhooks

### AI features not working
- Verify GEMINI_API_KEY and GROQ_API_KEY are set
- Check AI balance is > 0
- Review server logs for API errors

### Integration OAuth failures
- Verify callback URLs match exactly
- Check client ID/secret are correct
- Review Fortnox/Visma dashboard for errors

---

## Launch Checklist

- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Stripe webhook configured
- [ ] OAuth callbacks registered
- [ ] SSL certificate valid
- [ ] Domain configured correctly
- [ ] Health check passing
- [ ] Critical flows tested
- [ ] Error monitoring enabled
- [ ] Backup strategy in place

---

## Support

For issues, contact support@frost.se or create a GitHub issue.

