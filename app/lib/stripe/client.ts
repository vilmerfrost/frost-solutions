import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
  stripeInstance = new Stripe(key, {
    apiVersion: '2025-12-18.acacia' as Stripe.LatestApiVersion,
  })
  return stripeInstance
}
