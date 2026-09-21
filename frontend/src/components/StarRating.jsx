import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const StarRating = ({
  rating = 0,
  max = 5,
  interactive = false,
  onChange,
  size = 'md',
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const iconSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const isFilled = (hoverRating || rating) >= starValue;



        return (
        
          <button
            key={index}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange && onChange(starValue)}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`${
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
            } p-0.5 focus:outline-none`}
          >
            <Star
              className={`${iconSize} transition-colors ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-slate-100 text-slate-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
