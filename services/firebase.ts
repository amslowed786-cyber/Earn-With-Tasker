
import { User, VIPPlan, Task, WithdrawalRequest } from '../types';
import { INITIAL_TASKS } from '../constants';

// Simulated Firebase Realtime Database / Firestore using LocalStorage
const DB_KEYS = {
  USERS: 'ewt_users',
  TASKS: 'ewt_tasks',
  SYSTEM_TASKS: 'ewt_system_tasks', // Global tasks defined by admin
  WITHDRAWALS: 'ewt_withdrawals',
  SETTINGS: 'ewt_settings',
  SESSION_USER_ID: 'ewt_session_uid'
};

export const firebaseSim = {
  // --- Session Management ---
  setSession: (userId: string) => {
    localStorage.setItem(DB_KEYS.SESSION_USER_ID, userId);
  },
  
  getSessionId: (): string | null => {
    return localStorage.getItem(DB_KEYS.SESSION_USER_ID);
  },

  clearSession: () => {
    localStorage.removeItem(DB_KEYS.SESSION_USER_ID);
  },

  // --- Auth & Users ---
  getUsers: (): User[] => {
    const data = localStorage.getItem(DB_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },

  getUserByPhone: (phone: string): User | undefined => {
    return firebaseSim.getUsers().find(u => u.phone === phone);
  },

  getUserById: (id: string): User | undefined => {
    return firebaseSim.getUsers().find(u => u.id === id);
  },

  saveUser: (user: User) => {
    const users = firebaseSim.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index > -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
  },

  // --- Admin Task Management (System Tasks) ---
  getSystemTasks: (): Task[] => {
    const data = localStorage.getItem(DB_KEYS.SYSTEM_TASKS);
    return data ? JSON.parse(data) : INITIAL_TASKS;
  },

  saveSystemTasks: (tasks: Task[]) => {
    localStorage.setItem(DB_KEYS.SYSTEM_TASKS, JSON.stringify(tasks));
  },

  // --- User-specific Task Progress ---
  getUserTasks: (userId: string): Task[] => {
    const systemTasks = firebaseSim.getSystemTasks();
    const userProgressData = localStorage.getItem(`${DB_KEYS.TASKS}_${userId}`);
    const userProgress: Record<string, boolean> = userProgressData ? JSON.parse(userProgressData) : {};
    
    // Map system tasks to user progress
    return systemTasks.map(st => ({
      ...st,
      isCompleted: !!userProgress[st.id]
    }));
  },

  saveUserTasks: (userId: string, tasks: Task[]) => {
    const progress: Record<string, boolean> = {};
    tasks.forEach(t => {
      if (t.isCompleted) progress[t.id] = true;
    });
    localStorage.setItem(`${DB_KEYS.TASKS}_${userId}`, JSON.stringify(progress));
  },

  // --- Withdrawals ---
  getWithdrawals: (): WithdrawalRequest[] => {
    const data = localStorage.getItem(DB_KEYS.WITHDRAWALS);
    return data ? JSON.parse(data) : [];
  },

  submitWithdrawal: (req: WithdrawalRequest) => {
    const list = firebaseSim.getWithdrawals();
    list.push(req);
    localStorage.setItem(DB_KEYS.WITHDRAWALS, JSON.stringify(list));
  },

  updateWithdrawalStatus: (id: string, status: 'APPROVED' | 'REJECTED') => {
    const list = firebaseSim.getWithdrawals();
    const index = list.findIndex(w => w.id === id);
    if (index > -1) {
      list[index].status = status;
      localStorage.setItem(DB_KEYS.WITHDRAWALS, JSON.stringify(list));
    }
  }
};
