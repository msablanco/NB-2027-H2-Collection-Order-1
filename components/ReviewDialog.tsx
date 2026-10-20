import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X } from 'lucide-react';
import { useReviews } from '../context/ReviewsContext';

interface ReviewDialogProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ReviewDialog: React.FC<ReviewDialogProps> = ({ productId, productName, isOpen, onClose }) => {
  const { getReview, addReview } = useReviews();
  const existingReview = getReview(productId);

  const [comment, setComment] = useState(existingReview?.comment || '');
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setComment(existingReview?.comment || '');
      setRating(existingReview?.rating || 0);
      setHoveredRating(0);
      // Auto-focus when dialog opens
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, existingReview]);

  const handleSave = () => {
    addReview(productId, comment, rating);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-800">Comentarios para {productName}</h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valoración (Opcional)
                  </label>
                  <div className="flex gap-1" onMouseLeave={() => setHoveredRating(0)}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className="p-1 transition-transform hover:scale-110"
                        onMouseEnter={() => setHoveredRating(star)}
                        onClick={() => setRating(star)}
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= (hoveredRating || rating)
                              ? 'fill-yellow-400 text-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comentarios
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Escribe tus comentarios aquí..."
                    className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-[#CF0A2C] focus:border-[#CF0A2C] resize-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t border-gray-100">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#CF0A2C] hover:bg-[#B00824] rounded-lg shadow-sm transition-colors"
                >
                  Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReviewDialog;
