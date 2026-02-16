import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import {
  MagnifyingGlassIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';

const DashboardLayout = ({ children, role = 'student' }) => {
  const [isDark, setIsDark] = useState(false);
  const [notifications, setNotifications] = useState(3);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gradient-space overflow-hidden">
      {/* Sidebar */}
      <Sidebar role={role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="h-16 bg-white dark:bg-slate-900/50 dark:backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6"
        >
          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-primary-500 rounded-lg text-sm transition-all outline-none"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <AnimatePresence mode="wait">
                {isDark ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SunIcon className="w-5 h-5 text-amber-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MoonIcon className="w-5 h-5 text-slate-600" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <BellIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              {notifications > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                >
                  {notifications}
                </motion.span>
              )}
            </motion.button>

            {/* User Avatar */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold cursor-pointer shadow-glow-sm"
            >
              P
            </motion.div>
          </div>
        </motion.header>

        {/* Main Content with Page Transitions */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={children?.key || 'default'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
