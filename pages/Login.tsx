
import React, { useState } from 'react';
import { UserRole, UserProfile, VehicleType } from '../types';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
  onRegister: (data: Partial<UserProfile>) => void;
  onGoToAdmin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, onGoToAdmin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<UserRole>(UserRole.RIDER);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    licensePlate: '',
    vehicleModel: '',
    vehicleType: VehicleType.CAR
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegistering) {
      if (!formData.phone.trim()) {
        alert("O campo Telefone é obrigatório para todos os usuários.");
        return;
      }

      if (role === UserRole.DRIVER) {
        if (!formData.licensePlate.trim() || !formData.vehicleModel.trim()) {
          alert("Atenção: Placa e modelo do veículo são obrigatórios para o cadastro de motoristas.");
          return;
        }
      }
      
      onRegister({ 
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        licensePlate: role === UserRole.DRIVER ? formData.licensePlate : undefined,
        vehicleModel: role === UserRole.DRIVER ? formData.vehicleModel : undefined,
        vehicleType: role === UserRole.DRIVER ? formData.vehicleType : undefined,
        role 
      });
    } else {
      // Login simulado - preenche com dados padrão se não houver telefone
      onLogin({
        id: `u-${Date.now()}`,
        name: formData.email.split('@')[0],
        email: formData.email,
        phone: formData.phone || '(00) 00000-0000',
        role: role,
        avatar: `https://picsum.photos/seed/${formData.email}/200`
      } as UserProfile);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-10 bg-indigo-950 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <div className="w-20 h-20 bg-white rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg transform -rotate-6 transition-transform hover:rotate-0">
            <span className="text-indigo-950 font-black text-5xl">D</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight">Duarte Entregas</h2>
          <p className="text-indigo-300/60 mt-2 font-medium">Crie sua conta e comece agora</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-4">
            {[
              { id: UserRole.RIDER, label: 'Passageiro', icon: 'fa-user' },
              { id: UserRole.DRIVER, label: 'Motorista', icon: 'fa-car' }
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`flex flex-col items-center justify-center py-3 px-1 rounded-xl transition-all ${role === r.id ? 'bg-white shadow-md text-indigo-950' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <i className={`fas ${r.icon} text-sm mb-1`}></i>
                <span className="text-[10px] font-black uppercase tracking-widest">{r.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nome Completo *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold" placeholder="Seu Nome" />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Telefone / WhatsApp *</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold" placeholder="(00) 00000-0000" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email *</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold" placeholder="seu@email.com" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Senha *</label>
              <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-600 outline-none transition-all font-bold" placeholder="••••••••" />
            </div>

            {isRegistering && role === UserRole.DRIVER && (
              <div className="space-y-4 animate-slide-up bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                <label className="block text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-2">Dados do Veículo (Obrigatório)</label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, vehicleType: VehicleType.CAR})}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-xl border-2 transition-all ${formData.vehicleType === VehicleType.CAR ? 'bg-indigo-950 text-white border-indigo-950' : 'bg-white text-indigo-950 border-slate-200'}`}
                  >
                    <i className="fas fa-car"></i>
                    <span className="text-[10px] font-black uppercase">Carro</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, vehicleType: VehicleType.MOTORCYCLE})}
                    className={`flex items-center justify-center space-x-2 p-3 rounded-xl border-2 transition-all ${formData.vehicleType === VehicleType.MOTORCYCLE ? 'bg-indigo-950 text-white border-indigo-950' : 'bg-white text-indigo-950 border-slate-200'}`}
                  >
                    <i className="fas fa-motorcycle"></i>
                    <span className="text-[10px] font-black uppercase">Moto</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-2">Placa *</label>
                    <input required type="text" value={formData.licensePlate} onChange={e => setFormData({...formData, licensePlate: e.target.value.toUpperCase()})} className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-indigo-600 outline-none font-bold" placeholder="ABC-1234" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-2">Modelo *</label>
                    <input required type="text" value={formData.vehicleModel} onChange={e => setFormData({...formData, vehicleModel: e.target.value})} className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-indigo-600 outline-none font-bold" placeholder="Honda/Preta" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="w-full bg-indigo-950 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-indigo-900 transition-all shadow-2xl active:scale-95">
            {isRegistering ? 'CRIAR MINHA CONTA' : 'ACESSAR CONTA'}
          </button>

          <p className="text-center text-sm font-bold text-slate-400">
            {isRegistering ? 'Já possui acesso?' : 'Não possui conta?'}
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="ml-2 text-indigo-950 font-black hover:underline transition-all">
              {isRegistering ? 'Login' : 'Cadastre-se'}
            </button>
          </p>
        </form>
      </div>
      <button onClick={onGoToAdmin} className="mt-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-indigo-950 transition-colors">Portal de Gestão Duarte Entregas</button>
    </div>
  );
};

export default Login;
