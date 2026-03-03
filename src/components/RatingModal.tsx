import React, { useState } from 'react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  productCount?: number;
}

export default function RatingModal({ isOpen, onClose, productCount = 10 }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleRateOnPlayStore = () => {
    setSubmitted(true);
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.catshare.official';
    window.open(playStoreUrl, '_blank');
    
    // Close modal after a short delay
    setTimeout(() => {
      onClose();
      setRating(0);
      setSubmitted(false);
    }, 500);
  };

  const handleMaybeLater = () => {
    onClose();
    setRating(0);
    setSubmitted(false);
  };

  const getRatingMessage = (stars: number): string => {
    switch (stars) {
      case 1:
        return "We're sorry to hear you're not satisfied. Your feedback helps us improve. Please share details on the Play Store to help us understand what went wrong.";
      case 2:
        return "Thank you for your honest feedback. We'd love to know what we can improve. Please share your thoughts on the Play Store.";
      case 3:
        return "Thanks for the feedback! We're working hard to make CatShare even better. Help us know how we can improve.";
      case 4:
        return "Great! We're glad you're enjoying CatShare. Your positive feedback motivates us. Share your experience on the Play Store!";
      case 5:
        return "Wow, thank you! We're thrilled you love CatShare. Your 5-star review on the Play Store means a lot to us!";
      default:
        return '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={handleMaybeLater}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-sm w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            Love CatShare?
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You've created {productCount} products! Help us improve by sharing your feedback.
          </p>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-3 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110 focus:outline-none"
            >
              <svg
                className={`w-8 h-8 ${
                  star <= (hoverRating || rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              </svg>
            </button>
          ))}
        </div>

        {/* Feedback Text */}
        {rating > 0 && (
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-6 min-h-[60px] flex items-center justify-center">
            {getRatingMessage(rating)}
          </p>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleMaybeLater}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleRateOnPlayStore}
            disabled={rating === 0}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors ${
              rating > 0
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            {submitted ? 'Opening...' : 'Rate on Play Store'}
          </button>
        </div>
      </div>
    </div>
  );
}
