'use client';

import { Check, Shield } from 'lucide-react';

interface Feature {
  text: string;
}

interface PlanCardProps {
  companyName: string;
  planName: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: Feature[];
  additionalInfo: string[];
}

const PlanCard = ({
  companyName,
  planName,
  price,
  currency,
  period,
  description,
  features,
  additionalInfo,
}: PlanCardProps) => {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-lg transition-all duration-300 hover:shadow-xl border border-gray-100">
      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100">{companyName}</p>
            <h3 className="text-xl font-bold text-white">{planName}</h3>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold text-white">{price}</span>
            <p className="text-sm text-blue-100">{currency}/{period}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="mb-6 text-sm text-gray-500">{description}</p>

        {/* Features List */}
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                <Check className="h-3.5 w-3.5 text-green-600" />
              </div>
              <span className="text-sm text-gray-700">{feature.text}</span>
            </li>
          ))}
        </ul>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200" />

        {/* Additional Info */}
        <ul className="space-y-2">
          {additionalInfo.map((info, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-500">{info}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Trust Footer */}
      <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-xs text-gray-500">Secure payment</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.664 2.131-1.664 1.483 0 2.158.682 2.407 1.77l2.876-.558C17.61 4.177 15.744 2.5 12.75 2.5c-3.096 0-5.308 1.935-5.308 4.597 0 2.717 2.17 3.658 4.593 4.577 2.424.919 3.612 1.483 3.612 2.65 0 1.11-.867 1.847-2.45 1.847-1.83 0-2.793-.918-3.21-2.255l-2.928.618c.463 2.33 2.499 4.466 6.072 4.466 3.356 0 5.669-1.826 5.669-4.798 0-2.755-2.06-3.805-4.824-5.052z"/>
            </svg>
            <span className="text-xs text-gray-500">Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanCard;
