import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({
  children,
  variant = 'default',
  hover = true,
  glow = false,
  className = '',
  delay = 0,
  ...props
}) => {
  const variants = {
    default: 'card',
    glass: 'card-glass',
    gradient: 'bg-gradient-primary text-white',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={
        hover
          ? {
              y: -4,
              scale: 1.02,
              transition: { duration: 0.2 },
            }
          : {}
      }
      className={`
        ${variants[variant]}
        ${hover ? 'cursor-pointer' : ''}
        ${glow ? 'hover-glow' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Stat Card Component
export const StatCard = ({ title, value, icon: Icon, trend, color = 'primary', delay = 0 }) => {
  const colors = {
    primary: 'from-primary-500 to-primary-600',
    secondary: 'from-secondary-500 to-secondary-600',
    accent: 'from-accent-400 to-accent-500',
    success: 'from-green-500 to-green-600',
    warning: 'from-amber-500 to-amber-600',
    danger: 'from-red-500 to-red-600',
  };

  return (
    <AnimatedCard delay={delay} hover glow>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            {title}
          </p>
          <motion.h3
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: delay + 0.2, type: 'spring' }}
            className="text-3xl font-bold text-slate-900 dark:text-white"
          >
            {value}
          </motion.h3>
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3 }}
              className={`
                flex items-center gap-1 mt-2 text-sm font-medium
                ${trend.positive ? 'text-green-500' : 'text-red-500'}
              `}
            >
              <span>{trend.positive ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </motion.div>
          )}
        </div>
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: delay + 0.1, type: 'spring' }}
          className={`
            w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]}
            flex items-center justify-center shadow-glow
          `}
        >
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </motion.div>
      </div>
    </AnimatedCard>
  );
};

// Info Card Component
export const InfoCard = ({ title, description, icon: Icon, action, delay = 0 }) => {
  return (
    <AnimatedCard delay={delay} hover>
      <div className="flex items-start gap-4">
        {Icon && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: delay + 0.1, type: 'spring' }}
            className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0"
          >
            <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </motion.div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            {title}
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            {description}
          </p>
          {action && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              {action}
            </motion.button>
          )}
        </div>
      </div>
    </AnimatedCard>
  );
};

// Feature Card Component
export const FeatureCard = ({ title, description, icon, gradient, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -8, scale: 1.03 }}
      className="relative group"
    >
      <div className="card-glass p-6 h-full">
        {/* Gradient Background on Hover */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}
        />

        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: delay + 0.2, type: 'spring' }}
            className="text-4xl mb-4"
          >
            {icon}
          </motion.div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {title}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AnimatedCard;
