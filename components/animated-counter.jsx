"use client";

import React, { useEffect, useRef, useState } from "react";

const AnimatedCounter = ({ 
  end, 
  duration = 2000, 
  suffix = "", 
  prefix = "",
  className = ""
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const counterRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Reset count to 0 and start animation every time
          setCount(0);
          setIsVisible(true);
        } else {
          // Reset when out of view
          setIsVisible(false);
        }
      },
      { 
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => {
      if (counterRef.current) {
        observer.unobserve(counterRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * end);
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, end, duration]);

  return (
    <h3 ref={counterRef} className={`text-4xl font-bold ${className}`}>
      {prefix}{count}{suffix}
    </h3>
  );
};

export default AnimatedCounter;
