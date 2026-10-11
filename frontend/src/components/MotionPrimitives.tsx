import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const PageTransition: React.FC<Props> = ({ children, className = '' }) => {
  const shouldReduce = useReducedMotion();

  return (
    <motion.main
      initial={shouldReduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduce ? { opacity: 1 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`min-h-[calc(100vh-4.5rem)] ${className}`}
    >
      {children}
    </motion.main>
  );
};

export const StaggerContainer: React.FC<Props> = ({ children, className = '', delay = 0 }) => {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.08,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const FadeUp: React.FC<Props> = ({ children, className = '', delay = 0 }) => {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      variants={{
        hidden: shouldReduce ? { opacity: 1 } : { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
      }}
      initial="hidden"
      animate="show"
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const CardElevated: React.FC<Props & { onClick?: () => void }> = ({
  children,
  className = '',
  onClick,
}) => {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 shadow-premium hover:shadow-premium-hover transition-colors ${className}`}
    >
      {children}
    </motion.div>
  );
};
