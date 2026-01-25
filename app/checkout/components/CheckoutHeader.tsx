'use client';

import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface CheckoutHeaderProps {
  title: string;
  subtitle: string;
  highlight: string;
}

const CheckoutHeader = ({ title, subtitle, highlight }: CheckoutHeaderProps) => {
  return (
    <header className="mb-10 text-center">
      {/* Back Link */}
      <div className="mb-8 flex justify-between items-center">
        <div className="flex items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
        </div>
        <Link
          href="/dashboard"
          className="group flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to dashboard
        </Link>
      </div>

      {/* Title */}
      <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {title}{' '}
        <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
          {highlight}
        </span>
      </h1>
      <p className="mx-auto max-w-lg text-base text-gray-500">{subtitle}</p>
    </header>
  );
};

export default CheckoutHeader;
