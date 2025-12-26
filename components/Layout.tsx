
import React from 'react';
import { UserRole, UserProfile } from '../types';

interface LayoutProps {
  user: UserProfile;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, activeTab, setActiveTab }) => {
  const getRoleColor = () => {
    switch (user.role) {
      case UserRole.ADMIN: return 'bg-indigo-600';
      case UserRole.DRIVER: return 'bg-indigo-900';
      case UserRole.RIDER: return 'bg-indigo-950';
      default: return 'bg-indigo-950';
    }
  };

  const getNavLinks = () => {
    switch (user.role) {
      case UserRole.ADMIN:
        return [
          { id: 'home', icon: 'fa-chart-pie', label: 'Dashboard' },
          { id: 'users', icon: 'fa-users', label: 'Usuários' },
          { id: 'rides', icon: 'fa-route', label: 'Corridas' },
          { id: 'settings', icon: 'fa-cog', label: 'Configurações' },
        ];
      case UserRole.DRIVER:
        return [
          { id: 'home', icon: 'fa-car', label: 'Início' },
          { id: 'earnings', icon: 'fa-wallet', label: 'Ganhos' },
          { id: 'reviews', icon: 'fa-star', label: 'Avaliações' },
          { id: 'profile', icon: 'fa-user-circle', label: 'Perfil' },
        ];
      case UserRole.RIDER:
        return [
          { id: 'home', icon: 'fa-search', label: 'Pedir Corrida' },
          { id: 'history', icon: 'fa-history', label: 'Histórico' },
          { id: 'wallet', icon: 'fa-credit-card', label: 'Pagamento' },
          { id: 'discounts', icon: 'fa-gift', label: 'Descontos' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col w-64 ${getRoleColor()} text-white transition-all duration-300`}>
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-indigo-950 font-black text-2xl">D</span>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight leading-tight">Duarte Entregas</h1>
            <p className="text-[10px] opacity-60 uppercase tracking-widest">{user.role}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-1">
          {getNavLinks().map((link) => (
            <button 
              key={link.id} 
              onClick={() => setActiveTab(link.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors group ${activeTab === link.id ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              <i className={`fas ${link.icon} ${activeTab === link.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}></i>
              <span className="font-medium">{link.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-2xl">
            <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white/20" alt="" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <button onClick={onLogout} className="text-[10px] text-white/50 hover:text-white transition-colors uppercase font-bold">Sair do app</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className={`md:hidden flex items-center justify-between p-4 ${getRoleColor()} text-white sticky top-0 z-40`}>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-indigo-950 font-bold text-lg">D</span>
          </div>
          <span className="font-bold">Duarte Entregas</span>
        </div>
        <button onClick={onLogout} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden flex bg-white border-t border-slate-200 sticky bottom-0 z-40 px-2 py-1">
        {getNavLinks().map((link) => (
          <button 
            key={link.id} 
            onClick={() => setActiveTab(link.id)}
            className={`flex-1 flex flex-col items-center py-2 transition-colors ${activeTab === link.id ? 'text-indigo-950' : 'text-slate-400 hover:text-indigo-950'}`}
          >
            <i className={`fas ${link.icon} text-lg mb-1`}></i>
            <span className="text-[9px] font-bold uppercase tracking-tighter">{link.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
