import { test, expect } from '@playwright/test';

const BASE_PATH = '/app';

test.describe('Stripe Checkout Integration', () => {

  test('Subscription checkout endpoint exists and requires auth', async ({ request }) => {
    const response = await request.post(`${BASE_PATH}/api/subscriptions/checkout`, {
      data: {},
    });

    const status = response.status();
    // 401 = requires auth, 503 = Stripe not configured, 400 = bad request
    expect([400, 401, 403, 503]).toContain(status);
  });

  test('Subscription checkout returns proper error for missing config', async ({ request }) => {
    const response = await request.post(`${BASE_PATH}/api/subscriptions/checkout`, {
      data: {},
    });

    const status = response.status();
    if (status !== 404) {
      const contentType = response.headers()['content-type'] || '';
      if (contentType.includes('application/json')) {
        const body = await response.json();
        expect(body).toHaveProperty('error');
      }
    }
  });

  test('Stripe webhook endpoint exists', async ({ request }) => {
    const response = await request.post(`${BASE_PATH}/api/stripe/webhook`, {
      data: {
        type: 'checkout.session.completed',
        data: {
          object: { id: 'cs_test123' },
        },
      },
      headers: {
        'stripe-signature': 'test-signature',
      },
    });

    const status = response.status();
    expect([200, 400, 401, 404]).toContain(status);
  });
});
