// app/components/subscription/CancelSurveyModal.tsx
// Exit survey with discount offer when user tries to cancel
'use client';

import { useState } from 'react';
import { X, Gift, AlertTriangle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomerPortal } from '@/hooks/useSubscription';

interface CancelSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCancel: () => void;
}

const CANCEL_REASONS = [
  { id: 'too_expensive', label: 'För dyrt', offerDiscount: true },
  { id: 'not_using', label: 'Använder inte tjänsten tillräckligt', offerDiscount: false },
  { id: 'missing_features', label: 'Saknar funktioner jag behöver', offerDiscount: true },
  { id: 'switching', label: 'Byter till annan lösning', offerDiscount: true },
  { id: 'temporary', label: 'Pausar tillfälligt', offerDiscount: true },
  { id: 'technical_issues', label: 'Tekniska problem', offerDiscount: false },
  { id: 'other', label: 'Annat', offerDiscount: false },
];

const DISCOUNT_OFFER = {
  percentage: 30,
  months: 3,
  code: 'STANNA30',
};

export function CancelSurveyModal({ isOpen, onClose, onProceedToCancel }: CancelSurveyModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showDiscountOffer, setShowDiscountOffer] = useState(false);
  const [discountAccepted, setDiscountAccepted] = useState(false);
  const customerPortal = useCustomerPortal();

  if (!isOpen) return null;

  const selectedReasonData = CANCEL_REASONS.find(r => r.id === selectedReason);
  const shouldOfferDiscount = selectedReasonData?.offerDiscount && !discountAccepted;

  const handleSubmit = () => {
    if (!selectedReason) return;

    // If eligible for discount and haven't seen offer yet, show it
    if (shouldOfferDiscount && !showDiscountOffer) {
      setShowDiscountOffer(true);
      return;
    }

    // Log the cancellation reason (you could send this to an API)
    console.log('Cancel survey submitted:', {
      reason: selectedReason,
      feedback,
      discountOffered: shouldOfferDiscount,
      discountAccepted,
    });

    // Proceed to actual cancellation
    onProceedToCancel();
  };

  const handleAcceptDiscount = () => {
    setDiscountAccepted(true);
    setShowDiscountOffer(false);
    
    // Apply discount via customer portal or API
    // For now, just close and show success
    alert(`Rabattkod "${DISCOUNT_OFFER.code}" har aktiverats! Du får ${DISCOUNT_OFFER.percentage}% rabatt de nästa ${DISCOUNT_OFFER.months} månaderna.`);
    onClose();
  };

  // Discount offer screen
  if (showDiscountOffer) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Discount header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white text-center">
            <Gift className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-2xl font-bold mb-2">Vänta! Vi har ett erbjudande</h2>
            <p className="text-white/90">
              Vi vill verkligen att du ska stanna
            </p>
          </div>

          <div className="p-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-1">
                  {DISCOUNT_OFFER.percentage}% RABATT
                </div>
                <p className="text-gray-600">
                  i {DISCOUNT_OFFER.months} månader
                </p>
              </div>
            </div>

            <p className="text-gray-600 text-center mb-6">
              Fortsätt använda alla funktioner till ett lägre pris. 
              Ingen bindningstid - avsluta när du vill.
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleAcceptDiscount}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Gift className="w-4 h-4 mr-2" />
                Ja, aktivera rabatten!
              </Button>
              
            <Button
              onClick={handleSubmit}
              variant="secondary"
              className="w-full"
            >
              Nej tack, fortsätt avsluta
            </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main survey screen
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">Avsluta prenumeration</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Vi är ledsna att se dig gå! Berätta gärna varför du vill avsluta så att vi kan förbättra oss.
          </p>

          {/* Reason selection */}
          <div className="space-y-2 mb-6">
            <label className="text-sm font-medium text-gray-700">Varför vill du avsluta?</label>
            {CANCEL_REASONS.map((reason) => (
              <label
                key={reason.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedReason === reason.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="cancel_reason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">{reason.label}</span>
              </label>
            ))}
          </div>

          {/* Optional feedback */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4" />
              Ytterligare feedback (valfritt)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Berätta mer om din upplevelse..."
              className="w-full p-3 border border-gray-200 rounded-lg resize-none h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1"
            >
              Behåll prenumeration
            </Button>
            <Button
              onClick={handleSubmit}
              variant="destructive"
              className="flex-1"
              disabled={!selectedReason}
            >
              Fortsätt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CancelSurveyModal;
