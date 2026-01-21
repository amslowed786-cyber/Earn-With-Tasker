
import React, { useState, useEffect } from 'react';
import { User, UserView, VIPPlan, Task, WithdrawalRequest } from '../types';
import { VIP_PLANS } from '../constants';
import { firebaseSim } from '../services/firebase';

enum ExtendedUserView {
  SETTINGS = 'SETTINGS'
}

interface UserAppProps {
  user: User | null;
  setUser: (user: User | null) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const UserApp: React.FC<UserAppProps> = ({ user, setUser, isDarkMode, toggleTheme }) => {
  // Initialize view based on whether a user exists (Auto-login support)
  const [view, setView] = useState<UserView | ExtendedUserView>(user ? UserView.DASHBOARD : UserView.LOGIN);
  const [phone, setPhone] = useState('');
  const [refCode, setRefCode] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      setTasks(firebaseSim.getUserTasks(user.id));
      const userWithdrawals = firebaseSim.getWithdrawals().filter(w => w.userId === user.id);
      setWithdrawals(userWithdrawals.reverse()); // Latest first
      if (view === UserView.LOGIN) {
        setView(UserView.DASHBOARD);
      }
    } else {
      setView(UserView.LOGIN);
    }
  }, [user]);

  const handleLogin = () => {
    if (phone.length < 10) return alert('Enter valid phone');
    setLoading(true);

    setTimeout(() => {
      let existingUser = firebaseSim.getUserByPhone(phone);
      
      if (!existingUser) {
        existingUser = {
          id: 'uid_' + Math.random().toString(36).substr(2, 9),
          phone,
          balance: refCode ? 0.30 : 0,
          locked: refCode ? 0.30 : 0,
          withdrawable: 0,
          todayEarning: 0,
          vipPlanId: null,
          referralCode: 'EWT-' + Math.floor(1000 + Math.random() * 9000),
          referrals: 0,
          isBlocked: false,
          joinDate: new Date().toLocaleDateString()
        };
        firebaseSim.saveUser(existingUser);
      }

      if (existingUser.isBlocked) {
        alert("Your account is blocked. Contact support.");
        setLoading(false);
        return;
      }

      firebaseSim.setSession(existingUser.id);
      setUser(existingUser);
      setLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to sign out? Auto-login will be disabled until you sign in again.")) {
      firebaseSim.clearSession();
      setUser(null);
    }
  };

  const handleCopyCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const buyVIP = (plan: VIPPlan) => {
    if (!user) return;
    if (user.balance < plan.price) {
        alert("Insufficient balance. Please deposit funds first.");
        return;
    }
    
    const updatedUser = {
        ...user,
        balance: user.balance - plan.price,
        vipPlanId: plan.id,
        locked: 0,
        withdrawable: user.withdrawable + user.locked
    };
    setUser(updatedUser);
    firebaseSim.saveUser(updatedUser);
    alert(`${plan.name} activated successfully!`);
    setView(UserView.DASHBOARD);
  };

  const completeTask = (taskId: string) => {
    if (!user?.vipPlanId) return alert("Upgrade to VIP to start tasks!");
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1 || tasks[taskIndex].isCompleted) return;

    const newTasks = [...tasks];
    newTasks[taskIndex].isCompleted = true;
    setTasks(newTasks);
    firebaseSim.saveUserTasks(user.id, newTasks);

    const reward = newTasks[taskIndex].reward;
    const updatedUser = {
        ...user,
        balance: user.balance + reward,
        todayEarning: user.todayEarning + reward,
        withdrawable: user.withdrawable + reward
    };
    setUser(updatedUser);
    firebaseSim.saveUser(updatedUser);
  };

  const handleWithdraw = () => {
    if (!user || user.withdrawable < 2) return;
    
    const request: WithdrawalRequest = {
        id: 'req_' + Date.now(),
        userId: user.id,
        userName: user.phone,
        amount: user.withdrawable,
        method: 'EasyPaisa',
        account: user.phone,
        status: 'PENDING',
        date: new Date().toLocaleDateString()
    };

    firebaseSim.submitWithdrawal(request);
    
    const updatedUser = {
        ...user,
        balance: user.balance - user.withdrawable,
        withdrawable: 0
    };
    setUser(updatedUser);
    firebaseSim.saveUser(updatedUser);
    setWithdrawals([request, ...withdrawals]);
    alert("Withdrawal submitted for admin approval.");
  };

  // --- Wallet Analytics Component ---
  const WalletChart = () => {
    if (!user) return null;
    const max = Math.max(user.balance, user.withdrawable, user.locked, 1);
    const getWidth = (val: number) => (val / max) * 100;

    return (
      <div className={`p-6 rounded-[32px] border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Financial Overview</h4>
        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
              <span>Total Balance</span>
              <span className="text-blue-500">${user.balance.toFixed(2)}</span>
            </div>
            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]" 
                style={{ width: `${getWidth(user.balance)}%` }}
              ></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
              <span>Withdrawable</span>
              <span className="text-green-500">${user.withdrawable.toFixed(2)}</span>
            </div>
            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                style={{ width: `${getWidth(user.withdrawable)}%` }}
              ></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
              <span>Locked</span>
              <span className="text-red-500">${user.locked.toFixed(2)}</span>
            </div>
            <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(239,68,68,0.3)]" 
                style={{ width: `${getWidth(user.locked)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (view === UserView.LOGIN) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen px-6 transition-all duration-500 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-white text-gray-900'}`}>
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="bg-blue-600 w-24 h-24 rounded-3xl mx-auto flex items-center justify-center shadow-xl mb-6 transform rotate-3">
              <i className="fas fa-fire text-white text-4xl"></i>
            </div>
            <h1 className="text-4xl font-black tracking-tighter">TASKER</h1>
            <p className={`mt-2 text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Your VIP Earning Portal</p>
          </div>
          
          <div className="space-y-4">
            <div className="relative">
               <i className="fas fa-phone absolute left-4 top-5 text-gray-400"></i>
               <input 
                type="tel" 
                placeholder="Mobile Number" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full pl-12 pr-4 py-5 rounded-2xl outline-none border transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
              />
            </div>
            <div className="relative">
               <i className="fas fa-gift absolute left-4 top-5 text-gray-400"></i>
               <input 
                type="text" 
                placeholder="Referral Code (Optional)" 
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                className={`w-full pl-12 pr-4 py-5 rounded-2xl outline-none border transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
              />
            </div>
            <button 
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-2xl transition-all active:scale-95 flex justify-center items-center uppercase tracking-widest text-sm"
            >
              {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'Enter Application'}
            </button>
            <p className="text-[10px] text-center text-gray-400 uppercase font-black tracking-widest mt-4">Secure Firebase Authentication</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto min-h-screen pb-24 shadow-2xl relative overflow-hidden flex flex-col transition-all duration-500 ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* App Header */}
      <div className="bg-blue-600 pt-12 pb-20 px-6 rounded-b-[40px] shadow-lg relative">
        <div className="flex justify-between items-center text-white mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black text-xs">
                {user?.phone.substring(0,2)}
             </div>
             <div>
                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-wider">Account ID</p>
                <h2 className="text-lg font-black tracking-tight">{user?.phone}</h2>
             </div>
          </div>
          <button onClick={() => setView(ExtendedUserView.SETTINGS)} className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <i className="fas fa-cog text-xl"></i>
          </button>
        </div>

        <div className={`rounded-3xl p-6 shadow-2xl flex flex-col space-y-4 absolute left-6 right-6 top-32 transition-all ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Available Funds</p>
              <h3 className={`text-4xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>${user?.balance.toFixed(2)}</h3>
            </div>
            <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-blue-500/20">
               {user?.vipPlanId ? VIP_PLANS.find(p => p.id === user.vipPlanId)?.name : 'LOCKED'}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-36 px-6 overflow-y-auto flex-1 pb-10">
        {view === UserView.DASHBOARD && (
          <div className="space-y-6">
             <div className="flex gap-4">
               <button onClick={() => setView(UserView.WALLET)} className={`flex-1 p-5 rounded-3xl border transition-all active:scale-95 flex flex-col items-center gap-3 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                 <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <i className="fas fa-wallet text-blue-600 text-lg"></i>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-tight">Wallet</span>
               </button>
               <button onClick={() => setView(UserView.TASKS)} className={`flex-1 p-5 rounded-3xl border transition-all active:scale-95 flex flex-col items-center gap-3 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                 <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                    <i className="fas fa-tasks text-green-600 text-lg"></i>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-tight">Tasks</span>
               </button>
               <button onClick={() => setView(UserView.REFERRAL)} className={`flex-1 p-5 rounded-3xl border transition-all active:scale-95 flex flex-col items-center gap-3 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                 <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                    <i className="fas fa-users text-purple-600 text-lg"></i>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-tight">Refer</span>
               </button>
             </div>
             
             <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
               <div className="flex justify-between items-center mb-6">
                  <h4 className="text-sm font-black uppercase tracking-tight">Performance</h4>
                  <span className="text-[10px] text-gray-400 font-bold">{new Date().toDateString()}</span>
               </div>
               <div className="grid grid-cols-2 gap-8">
                  <div className="relative">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Daily Profit</p>
                    <p className="text-2xl font-black text-green-500 tracking-tighter">+${user?.todayEarning.toFixed(2)}</p>
                    <div className="h-1 bg-green-100 mt-2 rounded-full overflow-hidden">
                       <div className="h-full bg-green-500 w-[60%]"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Referrals</p>
                    <p className="text-2xl font-black tracking-tighter">{user?.referrals}</p>
                    <p className="text-[9px] text-gray-400 font-bold">LVL 1 Active</p>
                  </div>
               </div>
             </div>
          </div>
        )}

        {view === UserView.TASKS && (
          <div className="space-y-4">
            <h3 className="text-2xl font-black tracking-tighter">Active Tasks</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Daily resets at midnight</p>
            {tasks.map(task => (
              <div key={task.id} className={`p-5 rounded-3xl border flex items-center justify-between transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-md shadow-gray-200/20'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${task.isCompleted ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'}`}>
                    <i className={`fas ${task.type === 'CHECKIN' ? 'fa-calendar-check' : task.type === 'WATCH' ? 'fa-play-circle' : 'fa-arrow-alt-circle-down'} text-xl`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-black tracking-tight">{task.title}</p>
                    <p className="text-xs text-green-600 font-black">+${task.reward.toFixed(2)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => completeTask(task.id)}
                  disabled={task.isCompleted}
                  className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${task.isCompleted ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white shadow-lg active:scale-95 shadow-blue-500/20'}`}
                >
                  {task.isCompleted ? 'DONE' : 'CLAIM'}
                </button>
              </div>
            ))}
          </div>
        )}

        {view === UserView.VIP && (
          <div className="space-y-4 pb-10">
            <h3 className="text-2xl font-black tracking-tighter">Upgrade Plan</h3>
            {VIP_PLANS.map(plan => (
              <div key={plan.id} className={`p-6 rounded-[32px] border-2 transition-all relative overflow-hidden ${user?.vipPlanId === plan.id ? 'border-blue-600 bg-blue-600/5 shadow-xl shadow-blue-500/10' : (isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm')}`}>
                {user?.vipPlanId === plan.id && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-[8px] font-black uppercase transform rotate-45 translate-x-4 translate-y-2">Current</div>
                )}
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xl font-black tracking-tighter">{plan.name}</h4>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase block">Price</span>
                    <span className="text-2xl font-black text-blue-600 tracking-tighter">${plan.price}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight mb-1">Daily Limit</p>
                      <p className="text-xs font-black">{plan.dailyTasks} Tasks</p>
                   </div>
                   <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight mb-1">Daily Max</p>
                      <p className="text-xs font-black text-green-600">${plan.dailyEarning}</p>
                   </div>
                </div>
                <button 
                  onClick={() => buyVIP(plan)}
                  disabled={user?.vipPlanId === plan.id}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${user?.vipPlanId === plan.id ? 'bg-gray-200 text-gray-500' : 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 active:scale-95'}`}
                >
                  {user?.vipPlanId === plan.id ? 'ACTIVE' : 'ACTIVATE NOW'}
                </button>
              </div>
            ))}
          </div>
        )}

        {view === UserView.REFERRAL && (
          <div className="space-y-6">
            <h3 className="text-2xl font-black tracking-tighter">Refer & Earn</h3>
            
            <div className={`p-8 rounded-[40px] border flex flex-col items-center justify-center gap-4 ${isDarkMode ? 'bg-gray-900 border-gray-800 shadow-xl shadow-purple-500/5' : 'bg-white border-purple-100 shadow-xl shadow-purple-500/10'}`}>
              <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mb-2">
                <i className="fas fa-hand-holding-usd text-purple-600 text-3xl"></i>
              </div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Your Referral Code</p>
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 px-6 py-4 rounded-2xl border-2 border-dashed border-purple-200">
                <span className="text-2xl font-black tracking-widest font-mono text-purple-600">{user?.referralCode}</span>
                <button onClick={handleCopyCode} className="text-purple-600 hover:text-purple-700 active:scale-90 transition-all">
                  <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} text-lg`}></i>
                </button>
              </div>
              {copied && <p className="text-[10px] text-green-500 font-black uppercase">Copied to clipboard!</p>}
            </div>

            <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-50 shadow-sm'}`}>
              <h4 className="text-sm font-black uppercase tracking-tight mb-4">Program Details</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex-shrink-0 flex items-center justify-center">
                    <i className="fas fa-percent text-green-600 text-xs"></i>
                  </div>
                  <div>
                    <p className="text-xs font-black">20% Commission</p>
                    <p className="text-[10px] text-gray-500">Earn 20% of whatever your friend pays for their VIP plan instantly.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex-shrink-0 flex items-center justify-center">
                    <i className="fas fa-unlock text-blue-600 text-xs"></i>
                  </div>
                  <div>
                    <p className="text-xs font-black">Withdrawal Rule</p>
                    <p className="text-[10px] text-gray-500">You must have an active VIP plan to withdraw referral commissions.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className={`p-5 rounded-3xl border flex flex-col items-center gap-2 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <p className="text-[10px] text-gray-400 font-black uppercase">Direct Referrals</p>
                  <p className="text-2xl font-black">{user?.referrals}</p>
               </div>
               <div className={`p-5 rounded-3xl border flex flex-col items-center gap-2 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <p className="text-[10px] text-gray-400 font-black uppercase">Profit Earned</p>
                  <p className="text-2xl font-black text-green-500">$0.00</p>
               </div>
            </div>
          </div>
        )}

        {view === UserView.WALLET && (
          <div className="space-y-6 pb-12">
            <h3 className="text-2xl font-black tracking-tighter">Finance Center</h3>
            
            <WalletChart />

            <div className={`p-8 rounded-[40px] border flex flex-col items-center justify-center gap-3 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-xl shadow-blue-500/5'}`}>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Available to Withdraw</p>
              <h3 className="text-5xl font-black text-blue-600 tracking-tighter">${user?.withdrawable.toFixed(2)}</h3>
              <p className="text-[10px] bg-red-50 text-red-500 px-3 py-1 rounded-full font-black uppercase mt-2">Locked: ${user?.locked.toFixed(2)}</p>
            </div>
            
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-400 px-1 uppercase tracking-widest">Withdrawal Method</p>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-5 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${isDarkMode ? 'bg-gray-900 border-blue-600 shadow-lg shadow-blue-500/10' : 'bg-white border-blue-600 shadow-xl shadow-blue-500/10'}`}>
                   <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                     <i className="fas fa-mobile-alt text-blue-600 text-xl"></i>
                   </div>
                   <span className="text-[10px] font-black uppercase">EasyPaisa</span>
                </div>
                <div className={`p-5 rounded-3xl border-2 transition-all opacity-40 flex flex-col items-center gap-3 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                   <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                     <i className="fas fa-university text-gray-400 text-xl"></i>
                   </div>
                   <span className="text-[10px] font-black uppercase">Bank Trans</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleWithdraw}
              disabled={(user?.withdrawable || 0) < 2}
              className={`w-full py-5 rounded-2xl font-black shadow-2xl transition-all uppercase tracking-widest text-sm ${ (user?.withdrawable || 0) < 2 ? 'bg-gray-200 text-gray-400' : 'bg-blue-600 text-white shadow-blue-500/30 active:scale-95'}`}
            >
              Request Payout (Min $2)
            </button>

            {/* Withdrawal History Section */}
            <div className="space-y-4 mt-8">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-black uppercase tracking-tight">Request History</h4>
                <span className="text-[10px] font-bold text-gray-400">{withdrawals.length} Entries</span>
              </div>
              {withdrawals.length === 0 ? (
                <div className={`p-8 rounded-3xl border border-dashed text-center ${isDarkMode ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
                   <i className="fas fa-history text-2xl mb-3 block opacity-20"></i>
                   <p className="text-[10px] font-black uppercase tracking-widest">No previous requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map(w => (
                    <div key={w.id} className={`p-4 rounded-3xl border flex items-center justify-between transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                          w.status === 'APPROVED' ? 'bg-green-50 text-green-600' :
                          w.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                          'bg-orange-50 text-orange-600'
                        }`}>
                          <i className={`fas ${
                            w.status === 'APPROVED' ? 'fa-check-circle' :
                            w.status === 'REJECTED' ? 'fa-times-circle' :
                            'fa-clock'
                          }`}></i>
                        </div>
                        <div>
                          <p className="text-xs font-black tracking-tight">${w.amount.toFixed(2)}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">{w.date}</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter ${
                        w.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        w.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {w.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === ExtendedUserView.SETTINGS && (
          <div className="space-y-6">
            <h3 className="text-2xl font-black tracking-tighter">Preferences</h3>
            
            <div className={`p-6 rounded-[32px] border space-y-6 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-blue-50 text-blue-600'}`}>
                    <i className="fas fa-moon text-lg"></i>
                  </div>
                  <div>
                    <p className="text-sm font-black tracking-tight">Dark Experience</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">System theme override</p>
                  </div>
                </div>
                
                <button 
                  onClick={toggleTheme}
                  className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isDarkMode ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xl transition duration-200 ease-in-out ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

              <div className="flex items-center justify-between opacity-30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                    <i className="fas fa-shield-alt text-gray-400"></i>
                  </div>
                  <div>
                    <p className="text-sm font-black tracking-tight">Security Lock</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Fingerprint/PIN</p>
                  </div>
                </div>
                <i className="fas fa-chevron-right text-gray-300 text-xs"></i>
              </div>

              <div className="h-px bg-gray-100 dark:bg-gray-800"></div>

              <button 
                onClick={handleLogout}
                className="w-full text-left flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-50 group-hover:bg-red-600 transition-colors flex items-center justify-center">
                  <i className="fas fa-power-off text-red-500 group-hover:text-white"></i>
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight text-red-500">Sign Out</p>
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-tight">Clear local session</p>
                </div>
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Tasker v2.0.4 Platinum</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className={`fixed bottom-0 left-0 right-0 max-w-md mx-auto border-t px-6 py-5 flex justify-between items-center z-40 transition-all ${isDarkMode ? 'bg-gray-950/90 border-gray-800' : 'bg-white/95 border-gray-100 backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.03)]'}`}>
        <button onClick={() => setView(UserView.DASHBOARD)} className={`flex flex-col items-center gap-1.5 transition-all ${view === UserView.DASHBOARD ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
          <i className="fas fa-th-large text-lg"></i>
          <span className="text-[8px] font-black uppercase tracking-tighter">Main</span>
        </button>
        <button onClick={() => setView(UserView.TASKS)} className={`flex flex-col items-center gap-1.5 transition-all ${view === UserView.TASKS ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
          <i className="fas fa-bolt text-lg"></i>
          <span className="text-[8px] font-black uppercase tracking-tighter">Tasks</span>
        </button>
        <button onClick={() => setView(UserView.VIP)} className={`flex flex-col items-center gap-1.5 transition-all ${view === UserView.VIP ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
          <i className="fas fa-gem text-lg"></i>
          <span className="text-[8px] font-black uppercase tracking-tighter">VIP</span>
        </button>
        <button onClick={() => setView(UserView.REFERRAL)} className={`flex flex-col items-center gap-1.5 transition-all ${view === UserView.REFERRAL ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
          <i className="fas fa-users text-lg"></i>
          <span className="text-[8px] font-black uppercase tracking-tighter">Refer</span>
        </button>
        <button onClick={() => setView(UserView.WALLET)} className={`flex flex-col items-center gap-1.5 transition-all ${view === UserView.WALLET ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}>
          <i className="fas fa-wallet text-lg"></i>
          <span className="text-[8px] font-black uppercase tracking-tighter">Wallet</span>
        </button>
      </div>
    </div>
  );
};

export default UserApp;
