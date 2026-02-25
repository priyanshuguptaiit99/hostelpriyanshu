import React from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '../components/DashboardLayout';
import { StatCard, InfoCard, FeatureCard } from '../components/AnimatedCard';
import AnimatedButton from '../components/AnimatedButton';
import {
  CalendarIcon,
  CreditCardIcon,
  WrenchIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const StudentDashboard = () => {
  // Sample data
  const stats = [
    {
      title: 'Present Days',
      value: '24',
      icon: CheckCircleIcon,
      trend: { positive: true, value: '+12%' },
      color: 'success',
    },
    {
      title: 'Absent Days',
      value: '3',
      icon: XCircleIcon,
      trend: { positive: false, value: '-5%' },
      color: 'danger',
    },
    {
      title: 'Current Bill',
      value: '₹2,400',
      icon: CreditCardIcon,
      color: 'accent',
    },
    {
      title: 'Active Complaints',
      value: '2',
      icon: WrenchIcon,
      color: 'warning',
    },
  ];

  const recentActivity = [
    {
      title: 'Attendance Marked',
      description: 'You marked your attendance for today',
      icon: CalendarIcon,
      action: 'View Details',
    },
    {
      title: 'Bill Generated',
      description: 'Your mess bill for January has been generated',
      icon: CreditCardIcon,
      action: 'Pay Now',
    },
    {
      title: 'Complaint Updated',
      description: 'Your WiFi complaint is now in progress',
      icon: WrenchIcon,
      action: 'Track Status',
    },
  ];

  const quickActions = [
    {
      icon: '📅',
      title: 'Mark Attendance',
      description: 'Mark your daily attendance',
      gradient: 'from-primary-500 to-primary-600',
    },
    {
      icon: '💰',
      title: 'View Bills',
      description: 'Check your mess bills',
      gradient: 'from-accent-400 to-accent-500',
    },
    {
      icon: '🔧',
      title: 'Submit Complaint',
      description: 'Report any issues',
      gradient: 'from-amber-500 to-amber-600',
    },
    {
      icon: '📢',
      title: 'Announcements',
      description: 'Stay updated',
      gradient: 'from-secondary-500 to-secondary-600',
    },
  ];

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome back, Priyanshu! 👋
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Here's your hostel dashboard overview for January 2026
            </p>
          </div>
          <AnimatedButton variant="primary" icon={BellIcon}>
            View Announcements
          </AnimatedButton>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard key={stat.title} {...stat} delay={index * 0.1} />
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-bold text-slate-900 dark:text-white mb-4"
          >
            Quick Actions
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <FeatureCard key={action.title} {...action} delay={index * 0.1} />
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Recent Activity
                </h3>
                <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <InfoCard key={activity.title} {...activity} delay={index * 0.1} />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Attendance Calendar Preview */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                Attendance Overview
              </h3>
              
              {/* Progress Circle */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-slate-200 dark:text-slate-700"
                    />
                    <motion.circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={440}
                      initial={{ strokeDashoffset: 440 }}
                      animate={{ strokeDashoffset: 440 - (440 * 89) / 100 }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="text-primary-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        89%
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Attendance
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Present
                  </span>
                  <span className="text-lg font-bold text-green-700 dark:text-green-400">
                    24 days
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">
                    Absent
                  </span>
                  <span className="text-lg font-bold text-red-700 dark:text-red-400">
                    3 days
                  </span>
                </div>
              </div>

              <AnimatedButton variant="ghost" className="w-full mt-4">
                View Full Calendar
              </AnimatedButton>
            </motion.div>
          </div>
        </div>

        {/* Announcements Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card-glass bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-l-4 border-primary-500"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
              <BellIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                Important Announcement
              </h4>
              <p className="text-slate-600 dark:text-slate-400 mb-3">
                Hostel maintenance scheduled for this weekend. Please ensure all
                complaints are submitted by Friday.
              </p>
              <AnimatedButton variant="primary" size="sm">
                Read More
              </AnimatedButton>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
