
export enum AppView {
  USER_APP = 'USER_APP',
  ADMIN_PANEL = 'ADMIN_PANEL'
}

export enum UserView {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  TASKS = 'TASKS',
  VIP = 'VIP',
  WALLET = 'WALLET',
  REFERRAL = 'REFERRAL'
}

export enum AdminView {
  DASHBOARD = 'DASHBOARD',
  USERS = 'USERS',
  VIP_MANAGEMENT = 'VIP_MANAGEMENT',
  WITHDRAWALS = 'WITHDRAWALS',
  TASKS = 'TASKS'
}

export interface User {
  id: string;
  phone: string;
  balance: number;
  withdrawable: number;
  locked: number;
  todayEarning: number;
  vipPlanId: string | null;
  referralCode: string;
  referrals: number;
  isBlocked: boolean;
  joinDate: string;
}

export interface VIPPlan {
  id: string;
  name: string;
  price: number;
  dailyTasks: number;
  dailyEarning: number;
  validityDays: number;
}

export interface Task {
  id: string;
  title: string;
  type: 'INSTALL' | 'WATCH' | 'CHECKIN' | 'SHARE';
  reward: number;
  isCompleted: boolean;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: 'EasyPaisa' | 'JazzCash' | 'Bank';
  account: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  date: string;
}
