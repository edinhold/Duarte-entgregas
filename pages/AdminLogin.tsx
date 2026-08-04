
import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';
import { auth, googleProvider, signInWithPopup } from '../services/firebase';

interface AdminLoginProps {
  onLogin: (user: UserProfile) => void;
  onBackToPublic: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBackToPublic }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Em um sistema real, haveria uma verificação de backend aqui.
    // Para o demo, qualquer login no portal admin assume papel ADMIN.
    if (email.includes('admin') || password === 'admin123') {
      // Fixed: Added missing required 'phone' property
      onLogin({
        id: 'admin-1',
        name: 'Super Administrador',
        email: email,
        phone: '(00) 00000-0000',
        role: UserRole.ADMIN,
        avatar: 'https://picsum.photos/seed/admin/200'
      });
    } else {
      setError('Credenciais administrativas inválidas.');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        onLogin({
          id: result.user.uid,
          name: result.user.displayName || 'Administrador Google',
          email: result.user.email || '',
          phone: result.user.phoneNumber || '(00) 00000-0000',
          role: UserRole.ADMIN,
          avatar: result.user.photoURL || 'https://picsum.photos/seed/admin/200'
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setError('O popup de login do Google foi bloqueado pelo navegador. Por favor, permita popups para este site.');
      } else {
        setError('Ocorreu um erro ao autenticar com o Google: ' + (err.message || 'Erro desconhecido.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-950 p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl p-10 relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <i className="fas fa-shield-alt text-indigo-950 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Terminal de Comando</h2>
          <p className="text-indigo-200/50 text-xs font-bold mt-2 tracking-widest uppercase">Acesso Restrito ao Duarte Entregas</p>
        </div>

        <form onSubmit={handleAdminSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-2xl text-red-200 text-xs font-bold text-center animate-shake">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-indigo-200/40 uppercase tracking-widest mb-2 ml-1">ID do Administrador</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border-2 border-white/5 rounded-2xl focus:border-white focus:bg-white/10 outline-none transition-all font-bold text-white placeholder:text-white/20"
              placeholder="admin@duarte.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-indigo-200/40 uppercase tracking-widest mb-2 ml-1">Token de Acesso</label>
            <input 
              required
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-white/5 border-2 border-white/5 rounded-2xl focus:border-white focus:bg-white/10 outline-none transition-all font-bold text-white placeholder:text-white/20"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-white text-indigo-950 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-100 transition-all shadow-xl active:scale-95"
          >
            AUTENTICAR SISTEMA
          </button>

          {/* Divisor */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-[9px] font-black uppercase tracking-widest text-indigo-200/30">OU ACESSAR VIA</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 border border-indigo-400/20 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
            ) : (
              <i className="fab fa-google text-sm"></i>
            )}
            {isLoading ? 'CONECTANDO...' : 'ENTRAR COM CONTA GOOGLE'}
          </button>

          <button 
            type="button"
            onClick={onBackToPublic}
            className="w-full text-indigo-200/50 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors pt-2"
          >
            Voltar ao Início
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
