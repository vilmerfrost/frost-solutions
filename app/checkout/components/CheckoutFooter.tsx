'use client';

import Link from 'next/link';

const CheckoutFooter = () => {
  return (
    <footer className="mt-12 text-center">
      <p className="text-xs text-gray-500">
        By proceeding you agree to our{' '}
        <Link href="/terms" className="text-blue-600 underline-offset-4 hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-blue-600 underline-offset-4 hover:underline">
          Privacy Policy
        </Link>
      </p>
    </footer>
  );
};

export default CheckoutFooter;
