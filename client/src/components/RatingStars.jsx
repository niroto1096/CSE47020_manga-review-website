import React from "react";

const RatingStars = ({ value = 0, onSelect, readOnly = false }) => {
  return (
    <div className="mt-6 text-sm">
      <label className="mr-2">My Rating:</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => (!readOnly ? onSelect?.(star) : undefined)}
            disabled={readOnly}
            aria-disabled={readOnly}
              className={`text-2xl focus:outline-none ${readOnly ? "cursor-default opacity-90" : ""}`}
              title={`${star}/5`}
          >
            {star <= value ? "⭐" : "☆"}
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="text-gray-400 mt-1">
          You rated this {value}/5
        </p>
      )}
    </div>
  );
};

export default RatingStars;
