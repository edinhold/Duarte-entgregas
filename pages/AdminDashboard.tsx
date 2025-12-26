
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Ride, UserRole, RideStatus, PaymentSettings, VehicleType, PricingRule, PaymentMethod } from '../types';
import { getAdminBriefing } from '../services/geminiService';

interface AdminDashboardProps {
  users: UserProfile[];
  rides: Ride[];
  paymentSettings: PaymentSettings;
  onUpdateSettings: (settings: PaymentSettings) => void;
  onUpdateUser: (userId: string, updates: Partial<UserProfile>) => void;
  onDeleteUser: (userId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ users, rides, paymentSettings, onUpdateSettings, onUpdateUser, onDeleteUser }) => {
  const [aiBriefing, setAiBriefing] = useState("Analisando operações...");
  const [view, setView] = useState<'overview' | 'users' | 'rides' | 'pricing' | 'finance' | 'settings'>('overview');
  
  // Estados para edição de tarifas
  const [newRule, setNewRule] = useState<Omit<PricingRule, 'id'>>({
    regionName: '', basePrice: 0, pricePerKm: 0, active: true
  });

  // Estados para configuração de API
  const [apiConfig, setApiConfig] = useState({
    apiKey: paymentSettings.apiKey,
    provider: paymentSettings.provider,
    platformCommission: paymentSettings.platformCommission
  });

  const getUserById = (id?: string) => users.find(u => u.id === id);

  // Estatísticas de Usuários
  const userStats = useMemo(() => {
    const riders = users.filter(u => u.role === UserRole.RIDER).length;
    const drivers = users.filter(u => u.role === UserRole.DRIVER).length;
    return { riders, drivers, total: users.length };
  }, [users]);

  // Estatísticas Financeiras detalhadas por Motorista
  const driversFinance = useMemo(() => {
    return users.filter(u => u.role === UserRole.DRIVER).map(driver => {
      const driverRides = rides.filter(r => r.driverId === driver.id && r.status === RideStatus.COMPLETED);
      const totalBruto = driverRides.reduce((acc, r) => acc + r.price, 0);
      const comissaoTotal = totalBruto * (paymentSettings.platformCommission / 100);
      const valorAReceber = totalBruto - comissaoTotal;
      
      return {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        totalRides: driverRides.length,
        totalBruto,
        valorAReceber,
        avatar: driver.avatar
      };
    });
  }, [users, rides, paymentSettings.platformCommission]);

  const completedRides = useMemo(() => rides.filter(r => r.status === RideStatus.COMPLETED), [rides]);
  const totalRevenue = completedRides.reduce((acc, r) => acc + r.price, 0);
  const platformEarnings = totalRevenue * (paymentSettings.platformCommission / 100);

  useEffect(() => {
    const fetchBriefing = async () => {
      const activeRides = rides.filter(r => r.status !== RideStatus.COMPLETED && r.status !== RideStatus.CANCELLED).length;
      const briefing = await getAdminBriefing(activeRides, totalRevenue);
      setAiBriefing(briefing);
    };
    fetchBriefing();
  }, [rides, totalRevenue]);

  const handleAddPricingRule = () => {
    if (!newRule.regionName || newRule.basePrice <= 0 || newRule.pricePerKm <= 0) {
      alert("Preencha todos os campos da tarifa corretamente.");
      return;
    }
    const rule: PricingRule = { ...newRule, id: `rule-${Date.now()}` };
    onUpdateSettings({
      ...paymentSettings,
      pricingRules: [...paymentSettings.pricingRules, rule]
    });
    setNewRule({ regionName: '', basePrice: 0, pricePerKm: 0, active: true });
    alert("Nova regra de tarifa adicionada!");
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...paymentSettings,
      apiKey: apiConfig.apiKey,
      provider: apiConfig.provider,
      platformCommission: apiConfig.platformCommission
    });
    alert("Configurações de pagamento e API salvas com sucesso!");
  };

  const handleDeleteRule = (id: string) => {
    if (window.confirm("Deseja excluir esta regra de tarifa?")) {
      onUpdateSettings({
        ...paymentSettings,
        pricingRules: paymentSettings.pricingRules.filter(r => r.id !== id)
      });
    }
  };

  // Fix: Added missing confirmDeleteUser function to handle user deletion with a prompt
  const confirmDeleteUser = (id: string) => {
    if (window.confirm("Deseja realmente excluir este usuário? Esta ação não pode ser desfeita.")) {
      onDeleteUser(id);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Portal do Administrador</h2>
          <p className="text-slate-500 font-medium">Gestão financeira e operacional da Duarte.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Geral', icon: 'fa-home' },
            { id: 'finance', label: 'Finanças', icon: 'fa-wallet' },
            { id: 'pricing', label: 'Tarifas', icon: 'fa-tags' },
            { id: 'users', label: 'Usuários', icon: 'fa-users' },
            { id: 'settings', label: 'Configurações', icon: 'fa-cog' }
          ].map(v => (
            <button 
              key={v.id}
              onClick={() => setView(v.id as any)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shrink-0 flex items-center space-x-2 ${view === v.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <i className={`fas ${v.icon}`}></i>
              <span>{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {view === 'overview' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Lucro Plataforma</p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">R$ {platformEarnings.toFixed(2)}</h3>
              <p className="text-slate-400 text-[9px] font-bold mt-2">Taxa ativa: {paymentSettings.platformCommission}%</p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Volume Bruto</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">R$ {totalRevenue.toFixed(2)}</h3>
              <p className="text-slate-400 text-[9px] font-bold mt-2">{completedRides.length} viagens concluídas</p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Motoristas Ativos</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{userStats.drivers}</h3>
              <p className="text-slate-400 text-[9px] font-bold mt-2">Prontos para serviço</p>
            </div>
          </div>
          <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl flex items-center space-x-6">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md"><i className="fas fa-robot"></i></div>
            <p className="font-medium opacity-90">{aiBriefing}</p>
          </div>
        </>
      )}

      {view === 'finance' && (
        <div className="space-y-6 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Resumo de Pagamentos</h4>
                <div className="space-y-4">
                   <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                      <span className="text-sm font-bold text-slate-600">Total à Pagar (Motoristas)</span>
                      <span className="text-xl font-black text-indigo-950">R$ {(totalRevenue - platformEarnings).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-600">Retenção de Taxas ({paymentSettings.platformCommission}%)</span>
                      <span className="text-xl font-black text-indigo-600">R$ {platformEarnings.toFixed(2)}</span>
                   </div>
                </div>
             </div>
             <div className="bg-indigo-950 p-8 rounded-[2rem] text-white shadow-xl flex flex-col justify-center">
                <p className="text-[10px] font-black uppercase opacity-60 mb-2">Motoristas Cadastrados</p>
                <div className="flex items-baseline space-x-3">
                   <span className="text-5xl font-black">{userStats.drivers}</span>
                   <span className="text-xs font-bold opacity-60">colaboradores ativos</span>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h4 className="font-black text-indigo-950 uppercase text-xs tracking-widest">Detalhamento por Motorista</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4">Motorista</th>
                    <th className="px-6 py-4 text-center">Viagens</th>
                    <th className="px-6 py-4">Faturamento Bruto</th>
                    <th className="px-6 py-4 text-green-600 font-black">Valor Líquido (Receber)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {driversFinance.map(df => (
                    <tr key={df.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <img src={df.avatar} className="w-10 h-10 rounded-full border border-slate-100" />
                          <div>
                            <p className="font-bold text-slate-700">{df.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{df.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-black text-slate-500">{df.totalRides}</td>
                      <td className="px-6 py-4 font-bold text-slate-600">R$ {df.totalBruto.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="bg-green-50 text-green-600 px-4 py-2 rounded-xl font-black text-sm">
                          R$ {df.valorAReceber.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {driversFinance.length === 0 && (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-bold italic">Nenhum motorista com movimentação financeira.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === 'pricing' && (
        <div className="space-y-6 animate-slide-up">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <h4 className="font-black text-indigo-950 uppercase text-xs tracking-widest mb-6">Cadastrar Nova Tarifa Regional</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Região / Bairro</label>
                <input type="text" placeholder="Ex: Centro, Barra..." value={newRule.regionName} onChange={e => setNewRule({...newRule, regionName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-indigo-600 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bandeirada (Base)</label>
                <input type="number" placeholder="R$ 5.00" value={newRule.basePrice || ''} onChange={e => setNewRule({...newRule, basePrice: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-indigo-600 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Custo por KM</label>
                <input type="number" placeholder="R$ 2.50" value={newRule.pricePerKm || ''} onChange={e => setNewRule({...newRule, pricePerKm: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 rounded-xl font-bold border-2 border-transparent focus:border-indigo-600 outline-none" />
              </div>
              <button onClick={handleAddPricingRule} className="bg-indigo-950 text-white py-4 rounded-xl font-black text-xs uppercase shadow-lg hover:scale-[1.02] transition-transform">Adicionar Tarifa</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paymentSettings.pricingRules.map(rule => (
              <div key={rule.id} className={`bg-white p-6 rounded-3xl border-2 transition-all ${rule.active ? 'border-slate-100 shadow-sm' : 'border-dashed border-slate-200 opacity-60'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><i className="fas fa-map-marked-alt"></i></div>
                  <button onClick={() => handleDeleteRule(rule.id)} className="text-red-400 hover:text-red-600 p-2"><i className="fas fa-trash-alt"></i></button>
                </div>
                <h5 className="font-black text-indigo-950 uppercase text-sm mb-1">{rule.regionName}</h5>
                <div className="space-y-1 mb-4">
                  <p className="text-[10px] font-bold text-slate-400">BANDEIRADA: <span className="text-slate-900">R$ {rule.basePrice.toFixed(2)}</span></p>
                  <p className="text-[10px] font-bold text-slate-400">KILOMETRAGEM: <span className="text-slate-900">R$ {rule.pricePerKm.toFixed(2)}/km</span></p>
                </div>
                <div className="flex items-center space-x-2">
                   <div className={`w-2 h-2 rounded-full ${rule.active ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                   <span className="text-[9px] font-black uppercase text-slate-400">{rule.active ? 'Ativa no momento' : 'Inativa'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'settings' && (
        <div className="max-w-2xl mx-auto animate-slide-up">
          <form onSubmit={handleSaveSettings} className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-xl space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl mx-auto mb-4 flex items-center justify-center text-indigo-950">
                <i className="fas fa-shield-alt text-2xl"></i>
              </div>
              <h3 className="text-xl font-black text-indigo-950 uppercase tracking-tight">Configurações de Gateway</h3>
              <p className="text-slate-400 text-sm font-medium">Configure sua API para liberar pagamentos in-app.</p>
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Provedor de Pagamento</label>
                 <select value={apiConfig.provider} onChange={e => setApiConfig({...apiConfig, provider: e.target.value as any})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-bold text-slate-700">
                    <option value="Stripe">Stripe Payments</option>
                    <option value="MercadoPago">Mercado Pago</option>
                    <option value="PayPal">PayPal Business</option>
                 </select>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Chave Secreta da API (API KEY) *</label>
                 <input required type="password" value={apiConfig.apiKey} onChange={e => setApiConfig({...apiConfig, apiKey: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-bold" placeholder="sk_test_••••••••••••••••" />
                 <p className="text-[9px] text-indigo-400 font-bold uppercase mt-1">A carteira do usuário será habilitada após salvar uma chave válida.</p>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Comissão da Plataforma (%)</label>
                 <div className="relative">
                    <input type="number" value={apiConfig.platformCommission} onChange={e => setApiConfig({...apiConfig, platformCommission: parseFloat(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-bold" />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                 </div>
               </div>
            </div>

            <button type="submit" className="w-full bg-indigo-950 text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-indigo-900 transition-all active:scale-95">SALVAR CONFIGURAÇÕES</button>
          </form>
        </div>
      )}

      {view === 'users' && (
        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
           <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h4 className="font-black text-indigo-950 uppercase text-xs tracking-widest">Controle de Contas</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4">Usuário</th>
                    <th className="px-6 py-4">Contato</th>
                    <th className="px-6 py-4">Tipo</th>
                    <th className="px-6 py-4">Saldo Duarte Pay</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 flex items-center space-x-3">
                        <img src={u.avatar} className="w-10 h-10 rounded-full" />
                        <span className="font-bold text-slate-700">{u.name}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{u.phone}</td>
                      <td className="px-6 py-4">
                         <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${u.role === UserRole.DRIVER ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                           {u.role === UserRole.DRIVER ? 'Motorista' : u.role === UserRole.RIDER ? 'Passageiro' : 'Admin'}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.role === UserRole.RIDER ? (
                          <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">R$ {u.walletBalance?.toFixed(2) || '0,00'}</span>
                        ) : (
                          <span className="text-slate-300 font-bold ml-4">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button onClick={() => confirmDeleteUser(u.id)} className="text-red-400 hover:text-red-600 p-2"><i className="fas fa-trash-alt"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
