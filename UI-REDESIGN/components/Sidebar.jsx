import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  CreditCardIcon,
  WrenchIcon,
  BellIcon,
  ChartBarIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

const menuItems = {
  student: [
    { icon: HomeIcon, label: 'Dashboard', path: '/dashboard' },
    { icon: CalendarIcon, label: 'Attendance', path: '/attendance' },
    { icon: CreditCardIcon, label: 'Mess Bills', path: '/bills' },
    { icon: WrenchIcon, label: 'Complaints', path: '/complaints' },
    { icon: BellIcon, label: 'Announcements', path: '/announcements' },
  ],
  warden: [
    { icon: HomeIcon, label: 'Dashboard', path: '/dashboard' },
    { icon: UsersIcon, label: 'Students', path: '/students' },
    { icon: CalendarIcon, label: 'Attendance', path: '/attendance' },
    { icon: CreditCardIcon, label: 'Billing', path: '/billing' },
    { icon: WrenchIcon, label: 'Complaints', path: '/complaints' },
    { icon: BellIcon, label: 'Announcements', path: '/announcements' },
    { icon: ChartBarIcon, label: 'Reports', path: '/reports' },
  ],
  admin: [
    { icon: HomeIcon, label: 'Dashboard', path: '/dashboard' },
    { icon: UsersIcon, label: 'Users', path: '/users' },
    { icon: UsersIcon, label: 'Pending Wardens', path: '/pending-wardens' },
    { icon: BellIcon, label: 'Announcements', path: '/announcements' },
    { icon: ChartBarIcon, label: 'Analytics', path: '/analytics' },
    { icon: CogIcon, label: 'Settings', path: '/settings' },
  ],
};

const Sidebar = ({ role = 'student', currentPath = '/dashboard' }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const items = menuItems[role] || menuItems.student;

  return (
    <motion.aside
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`
        ${isCollapsed ? 'w-20' : 'w-64'}
        h-screen bg-white dark:bg-slate-900 
        border-r border-slate-200 dark:border-slate-800
        transition-all duration-300 ease-in-out
        flex flex-col
      `}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow-sm">
                <span className="text-xl">🏠</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  Hostel MS
                </h1>
                <p className="text-xs text-slate-500 capitalize">{role}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <svg
            className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform ${
              isCollapsed ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </motion.button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <motion.a
              key={item.path}
              href={item.path}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`
                sidebar-item group relative
                ${isActive ? 'sidebar-item-active' : ''}
              `}
            >
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r-full"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              {/* Icon with Glow Effect */}
              <div className="relative">
                <Icon className="w-5 h-5 transition-all" />
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-primary-500 rounded-full blur-md opacity-30"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Label */}
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for Collapsed State */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700" />
                </div>
              )}
            </motion.a>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`
            flex items-center gap-3 p-3 rounded-xl
            bg-slate-50 dark:bg-slate-800
            hover:bg-slate-100 dark:hover:bg-slate-700
            transition-colors cursor-pointer
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold shadow-glow-sm">
            P
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  Priyanshu
                </p>
                <p className="text-xs text-slate-500 truncate">
                  priyanshu@hostel.com
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
