import React, { useState } from 'react';
import axios from 'axios';

export default function ReviewForm({ mangaId, onReviewAdded }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/reviews', { manga: mangaId, rating, comment }, { withCredentials: true });
      setRating(5);
      setComment('');
      if (onReviewAdded) onReviewAdded();
    } catch (err) {
      alert('Failed to submit review');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Rating:
        <select value={rating} onChange={e => setRating(Number(e.target.value))}>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <label>
        Comment:
        <textarea value={comment} onChange={e => setComment(e.target.value)} required />
      </label>
      <button type="submit">Submit Review</button>
    </form>
  );
}