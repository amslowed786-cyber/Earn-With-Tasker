
import React, { useState, useEffect } from 'react';
import { AppView, User, UserView, AdminView } from './types';
import UserApp from './components/UserApp';
import AdminPanel from './components/AdminPanel';
import { firebaseSim } from './services/firebase';

const App: React.FC = () => {
  const [currentApp, setCurrentApp] = useState<AppView>(AppView.USER_APP);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // Auto-login effect - Runs once on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const sessionUid = firebaseSim.getSessionId();
        if (sessionUid) {
          const user = firebaseSim.getUserById(sessionUid);
          if (user && !user.isBlocked) {
            setCurrentUser(user);
          } else {
            // Clear stale or blocked sessions
            firebaseSim.clearSession();
          }
        }
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('ewt_theme');
        if (savedTheme === 'dark') setIsDarkMode(true);
      } catch (error) {
        console.error("Failed to initialize session", error);
      } finally {
        // Delay slightly for smooth splash transition
        setTimeout(() => setIsAppLoading(false), 1000);
      }
    };

    initializeApp();
  }, []);

  const toggleApp = () => {
    setCurrentApp(prev => prev === AppView.USER_APP ? AppView.ADMIN_PANEL : AppView.USER_APP);
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('ewt_theme', newMode ? 'dark' : 'light');
  };

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-blue-600 flex flex-col items-center justify-center transition-colors duration-500">
        <div className="text-white text-center animate-pulse">
          <div className="bg-white/20 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto mb-6 backdrop-blur-md shadow-2xl">
            <i className="fas fa-fire text-white text-4xl"></i>
          </div>
          <h1 className="text-2xl font-black tracking-tighter mb-1 uppercase">Tasker</h1>
          <p className="font-bold tracking-widest uppercase text-[10px] opacity-60">Initializing Secure Session</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-100 transition-all duration-700 ease-in-out ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button 
          onClick={toggleApp}
          className="bg-gray-900/80 backdrop-blur-md text-white border border-white/10 px-4 py-2 rounded-2xl text-[10px] font-black uppercase shadow-2xl hover:bg-blue-600 transition-all duration-300"
        >
          {currentApp === AppView.USER_APP ? (
            <span className="flex items-center gap-2"><i className="fas fa-user-shield"></i> Admin Panel</span>
          ) : (
            <span className="flex items-center gap-2"><i className="fas fa-mobile-alt"></i> User App</span>
          )}
        </button>
      </div>

      {currentApp === AppView.USER_APP ? (
        <UserApp user={currentUser} setUser={setCurrentUser} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      ) : (
        <AdminPanel />
      )}
    </div>
  );
};

export default App;
