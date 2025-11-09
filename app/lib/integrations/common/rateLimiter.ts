// app/lib/integrations/common/rateLimiter.ts

// Simple token-bucket per instance (process-memory). Sufficient in server runtime.
export class RateLimiter {
  #capacity: number;
  #tokens: number;
  #refillMs: number;
  #lastRefill: number;

  constructor({ capacityPerMin }: { capacityPerMin: number }) {
    this.#capacity = capacityPerMin;
    this.#tokens = capacityPerMin;
    this.#refillMs = 60_000;
    this.#lastRefill = Date.now();
  }

  async take(): Promise<void> {
    this.#refill();

    while (this.#tokens <= 0) {
      const waitMs = 100; // granularity
      await new Promise((res) => setTimeout(res, waitMs));
      this.#refill();
    }

    this.#tokens -= 1;
  }

  #refill() {
    const now = Date.now();
    const elapsed = now - this.#lastRefill;

    if (elapsed >= this.#refillMs) {
      this.#tokens = this.#capacity;
      this.#lastRefill = now;
    }
  }

  getRemainingRequests(): number {
    this.#refill();
    return this.#tokens;
  }

  getResetTime(): Date {
    return new Date(this.#lastRefill + this.#refillMs);
  }
}

