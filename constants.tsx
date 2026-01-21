
import { VIPPlan, Task } from './types';

export const VIP_PLANS: VIPPlan[] = [
  { id: 'vip1', name: 'VIP 1', price: 5, dailyTasks: 5, dailyEarning: 0.40, validityDays: 30 },
  { id: 'vip2', name: 'VIP 2', price: 10, dailyTasks: 10, dailyEarning: 0.80, validityDays: 30 },
  { id: 'vip3', name: 'VIP 3', price: 20, dailyTasks: 20, dailyEarning: 1.80, validityDays: 30 },
  { id: 'vip4', name: 'VIP 4', price: 40, dailyTasks: 40, dailyEarning: 4.00, validityDays: 30 },
];

export const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Daily Check-in', type: 'CHECKIN', reward: 0.05, isCompleted: false },
  { id: '2', title: 'Watch Ad Video', type: 'WATCH', reward: 0.10, isCompleted: false },
  { id: '3', title: 'Install Partner App', type: 'INSTALL', reward: 0.25, isCompleted: false },
  { id: '4', title: 'Share Earn with Tasker', type: 'SHARE', reward: 0.05, isCompleted: false },
];
