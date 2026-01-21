
import React, { useState, useEffect } from 'react';
import { AdminView, WithdrawalRequest, User, Task } from '../types';
import { VIP_PLANS } from '../constants';
import { firebaseSim } from '../services/firebase';

const AdminPanel: React.FC = () => {
  const [view, setView] = useState<AdminView>(AdminView.DASHBOARD);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [systemTasks, setSystemTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>('ALL');
  
  // New Task Form State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    type: 'WATCH',
    reward: 0.10
  });

  useEffect(() => {
    setUsers(firebaseSim.getUsers());
    setWithdrawals(firebaseSim.getWithdrawals());
    setSystemTasks(firebaseSim.getSystemTasks());
  }, [view]);

  const handleAction = (id: string, action: 'APPROVED' | 'REJECTED') => {
    firebaseSim.updateWithdrawalStatus(id, action);
    setWithdrawals(firebaseSim.getWithdrawals());
  };

  const toggleBlock = (userId: string) => {
    const list = firebaseSim.getUsers();
    const index = list.findIndex(u => u.id === userId);
    if (index > -1) {
        list[index].isBlocked = !list[index].isBlocked;
        firebaseSim.saveUser(list[index]);
        setUsers([...list]);
    }
  };

  const handleCreateTask = () => {
    if (!newTask.title) return alert("Title required");
    const task: Task = {
      id: 'task_' + Date.now(),
      title: newTask.title!,
      type: newTask.type as any,
      reward: Number(newTask.reward) || 0,
      isCompleted: false
    };
    const updated = [...systemTasks, task];
    setSystemTasks(updated);
    firebaseSim.saveSystemTasks(updated);
    setShowTaskModal(false);
    setNewTask({ title: '', type: 'WATCH', reward: 0.10 });
  };

  const deleteTask = (id: string) => {
    if (!confirm("Delete this task?")) return;
    const updated = systemTasks.filter(t => t.id !== id);
    setSystemTasks(updated);
    firebaseSim.saveSystemTasks(updated);
  };

  const filteredUsers = users.filter(user => 
    user.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTasks = systemTasks.filter(task => 
    taskTypeFilter === 'ALL' ? true : task.type === taskTypeFilter
  );

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
            <i className="fas fa-fire"></i>
          </div>
          <h1 className="text-xl font-bold">Firebase Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setView(AdminView.DASHBOARD)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === AdminView.DASHBOARD ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
            <i className="fas fa-chart-line w-5"></i> Dashboard
          </button>
          <button onClick={() => setView(AdminView.USERS)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === AdminView.USERS ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
            <i className="fas fa-users w-5"></i> Users
          </button>
          <button onClick={() => setView(AdminView.TASKS)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === AdminView.TASKS ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
            <i className="fas fa-bolt w-5"></i> Task Management
          </button>
          <button onClick={() => setView(AdminView.WITHDRAWALS)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${view === AdminView.WITHDRAWALS ? 'bg-blue-600' : 'hover:bg-gray-800'}`}>
            <i className="fas fa-money-bill w-5"></i> Withdrawals
          </button>
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <h2 className="text-xl font-bold uppercase tracking-tight">{view}</h2>
          <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Connected to Firebase
          </div>
        </header>

        <main className="p-8 flex-1">
          {view === AdminView.DASHBOARD && (
            <div className="grid grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-medium">Total Users</p>
                    <p className="text-3xl font-black mt-1">{users.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-medium">Pending Withdrawals</p>
                    <p className="text-3xl font-black text-red-500 mt-1">{withdrawals.filter(w => w.status === 'PENDING').length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm font-medium">System Tasks</p>
                    <p className="text-3xl font-black text-blue-500 mt-1">{systemTasks.length}</p>
                </div>
            </div>
          )}

          {view === AdminView.USERS && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center">
                <div className="relative flex-1 max-w-md">
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input 
                    type="text" 
                    placeholder="Search by phone number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-sm"
                  />
                </div>
                <div className="ml-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Showing {filteredUsers.length} Users
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 text-xs font-black uppercase tracking-widest text-gray-500">Phone</th>
                      <th className="p-4 text-xs font-black uppercase tracking-widest text-gray-500">Balance</th>
                      <th className="p-4 text-xs font-black uppercase tracking-widest text-gray-500">Status</th>
                      <th className="p-4 text-xs font-black uppercase tracking-widest text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b last:border-b-0 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">
                              {u.phone.substring(0, 2)}
                            </div>
                            <span className="font-bold text-gray-900">{u.phone}</span>
                          </div>
                        </td>
                        <td className="p-4 font-black text-green-600">${u.balance.toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${u.isBlocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {u.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="p-4">
                          <button onClick={() => toggleBlock(u.id)} className={`text-xs font-black uppercase tracking-widest underline decoration-2 underline-offset-4 ${u.isBlocked ? 'text-green-600' : 'text-red-500'}`}>{u.isBlocked ? 'Unblock' : 'Block User'}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === AdminView.TASKS && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                  <h3 className="text-xl font-bold">System Tasks</h3>
                  <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2 gap-3">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Filter:</span>
                    <select 
                      value={taskTypeFilter}
                      onChange={(e) => setTaskTypeFilter(e.target.value)}
                      className="bg-transparent text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="ALL">All Types</option>
                      <option value="WATCH">Watch Ads</option>
                      <option value="INSTALL">Installs</option>
                      <option value="CHECKIN">Check-ins</option>
                      <option value="SHARE">Shares</option>
                    </select>
                  </div>
                </div>
                <button 
                  onClick={() => setShowTaskModal(true)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <i className="fas fa-plus mr-2"></i> New Task
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 text-xs font-black uppercase tracking-widest text-gray-500">Task Title</th>
                      <th className="p-4 text-xs font-black uppercase tracking-widest text-gray-500">Type</th>
                      <th className="p-4 text-xs font-black uppercase tracking-widest text-gray-500">Reward</th>
                      <th className="p-4 text-xs font-black uppercase tracking-widest text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map(t => (
                      <tr key={t.id} className="border-b last:border-b-0 hover:bg-gray-50/50">
                        <td className="p-4 font-bold">{t.title}</td>
                        <td className="p-4">
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-black uppercase">{t.type}</span>
                        </td>
                        <td className="p-4 font-black text-green-600">${t.reward.toFixed(2)}</td>
                        <td className="p-4">
                          <button onClick={() => deleteTask(t.id)} className="text-red-500 hover:text-red-700 transition-colors">
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredTasks.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-gray-400 italic">No tasks found for this category.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {view === AdminView.WITHDRAWALS && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-gray-500">User</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-gray-500">Amount</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-gray-500">Status</th>
                    <th className="p-4 text-xs font-black uppercase tracking-widest text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map(w => (
                    <tr key={w.id} className="border-b last:border-b-0">
                      <td className="p-4 font-bold text-gray-900">{w.userName}</td>
                      <td className="p-4 font-black text-blue-600">${w.amount.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                          w.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          w.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {w.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleAction(w.id, 'APPROVED')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-xs font-black transition-all">Approve</button>
                            <button onClick={() => handleAction(w.id, 'REJECTED')} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-black transition-all">Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-black uppercase tracking-tight">Create Global Task</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Task Title</label>
                <input 
                  type="text" 
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500 font-medium"
                  placeholder="e.g. Subscribe to Channel"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Task Type</label>
                  <select 
                    value={newTask.type}
                    onChange={e => setNewTask({...newTask, type: e.target.value as any})}
                    className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500 font-medium appearance-none"
                  >
                    <option value="WATCH">Watch Ad</option>
                    <option value="INSTALL">App Install</option>
                    <option value="CHECKIN">Check-in</option>
                    <option value="SHARE">Share App</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reward ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={newTask.reward}
                    onChange={e => setNewTask({...newTask, reward: e.target.value as any})}
                    className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>
              <button 
                onClick={handleCreateTask}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all mt-4"
              >
                Publish Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
