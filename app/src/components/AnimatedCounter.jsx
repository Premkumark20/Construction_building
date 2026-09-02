import React, { useState, useEffect, useRef } from 'react';

const AnimatedCounter = ({ targetString, trigger = true }) => {
  const [count, setCount] = useState(0);
  const counterRef = useRef(null);

  // Parse numerical target e.g. "40+" -> 40, "150+" -> 150
  const numericVal = parseInt(String(targetString || '').replace(/\D/g, ''), 10) || 0;
  const suffix = String(targetString || '').replace(/[0-9]/g, ''); // "+" or similar

  useEffect(() => {
    if (!trigger || numericVal <= 0) {
      setCount(0);
      return;
    }

    let start = 0;
    setCount(0);
    const duration = 1000; // 1s smooth count up
    const stepTime = 20;
    const totalSteps = duration / stepTime;
    const increment = Math.max(1, Math.ceil(numericVal / totalSteps));

    const timer = setInterval(() => {
      start += increment;
      if (start >= numericVal) {
        setCount(numericVal);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [numericVal, trigger]);

  return (
    <span ref={counterRef}>
      {count}{suffix}
    </span>
  );
};

export default AnimatedCounter;
