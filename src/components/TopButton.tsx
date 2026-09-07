import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

export const TopButton: React.FC = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 400);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-slate-900 text-white
                 shadow-lg hover:bg-slate-800 transition-colors flex items-center justify-center"
      aria-label="맨 위로"
    >
      <ArrowUp className="w-5 h-5" aria-hidden="true" />
    </button>
  );
};
