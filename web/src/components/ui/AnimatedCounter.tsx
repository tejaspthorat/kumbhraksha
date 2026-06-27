'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export default function AnimatedCounter({ value, duration = 2, className, prefix = '', suffix = '' }: AnimatedCounterProps) {
  const [isClient, setIsClient] = useState(false);
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (v) => `${prefix}${Math.round(v).toLocaleString()}${suffix}`);

  useEffect(() => {
    setIsClient(true);
    spring.set(value);
  }, [spring, value]);

  if (!isClient) {
    return <span className={className}>{prefix}0{suffix}</span>;
  }

  return <motion.span className={className}>{display}</motion.span>;
}
