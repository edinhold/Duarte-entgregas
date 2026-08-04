import React, { useState } from 'react';
import { PushNotificationLog, UserProfile, UserRole } from '../types';
import { dispatchPushToDrivers, requestNotificationPermission } from '../services/notifications';

interface PushManagerProps {
  pushLogs: PushNotificationLog[];
  drivers: UserProfile[];
  onAddPushLog: (log: PushNotificationLog) => void;
}

const PushManager: React.FC<PushManagerProps> = ({
  pushLogs,
  drivers,
  onAddPushLog
}) => {
  const [testTitle, setTestTitle] = useState('🚚 Teste de Notificação Push');
  const [testMessage, setTestMessage] = useState('Notificação enviada pelo Administrador para verificar conectividade.');
  const [isSending, setIsSending] = useState(false);

  const onlineDrivers = drivers.filter(d => d.role === UserRole.DRIVER && d.isOnline);

  const handleSendTestPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    await requestNotificationPermission();

    const newLog = dispatchPushToDrivers(
      `test-${Date.now()}`,
      'Entrega Teste',
      25.0,
      22.5,
      '3.5 km',
      'São Paulo',
      onlineDrivers
    );
    newLog.title = testTitle;
    newLog.message = testMessage;
    newLog.status = 'TEST';

    onAddPushLog(newLog);
    setIsSending(false);
    alert(`Notificação enviada com sucesso para ${onlineDrivers.length} motorista(s) online!`);
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Test & Push Status Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center text-2xl shrink-0">
            <i className="fas fa-satellite-dish"></i>
          </div>
          <div>
            <h4 className="text-2xl font-black text-indigo-950">{onlineDrivers.length}</h4>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Motoristas Online Ativos</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center text-2xl shrink-0">
            <i className="fas fa-check-circle"></i>
          </div>
          <div>
            <h4 className="text-2xl font-black text-indigo-950">
              {pushLogs.reduce((acc, log) => acc + log.deliveredCount, 0)}
            </h4>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Notificações Entregues</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-14 h-14 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center text-2xl shrink-0">
            <i className="fas fa-bell"></i>
          </div>
          <div>
            <h4 className="text-2xl font-black text-indigo-950">{pushLogs.length}</h4>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Disparos de Push</p>
          </div>
        </div>
      </div>

      {/* Disparo de Teste */}
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center font-bold">
            <i className="fas fa-paper-plane"></i>
          </div>
          <div>
            <h3 className="text-xl font-black text-indigo-950">Disparar Notificação Push de Teste</h3>
            <p className="text-xs text-slate-400 font-medium">Envie um alerta instantâneo com som para testar a comunicação com todos os dispositivos online.</p>
          </div>
        </div>

        <form onSubmit={handleSendTestPush} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Título do Push</label>
              <input
                type="text"
                required
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-indigo-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Mensagem do Push</label>
              <input
                type="text"
                required
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium text-sm text-slate-800 outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => requestNotificationPermission()}
              className="text-xs text-indigo-600 font-bold hover:underline flex items-center space-x-1"
            >
              <i className="fas fa-lock-open"></i>
              <span>Permitir Notificações no Navegador</span>
            </button>

            <button
              type="submit"
              disabled={isSending}
              className="bg-indigo-950 hover:bg-indigo-900 text-white font-black uppercase text-xs tracking-wider px-8 py-3.5 rounded-xl shadow-md transition-all flex items-center space-x-2"
            >
              <i className="fas fa-broadcast-tower"></i>
              <span>{isSending ? 'Enviando...' : 'Enviar Push de Teste'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Histórico de Push Logs */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm space-y-4">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h4 className="font-black text-indigo-950 uppercase text-xs tracking-widest">Histórico de Disparos Push</h4>
          <p className="text-xs text-slate-400">Logs detalhados de envios para motoristas em tempo real.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
              <tr>
                <th className="px-6 py-4">Data & Hora</th>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Mensagem</th>
                <th className="px-6 py-4">Alvo</th>
                <th className="px-6 py-4">Entregues</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {pushLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600 whitespace-nowrap">
                    {new Date(log.sentAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-950 text-xs">
                    {log.title}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                    {log.message}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-700">
                    {log.targetDriverCount} motorista(s)
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-emerald-600">
                    {log.deliveredCount} ({log.targetDriverCount > 0 ? Math.round((log.deliveredCount / log.targetDriverCount) * 100) : 100}%)
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                      log.status === 'SENT' ? 'bg-emerald-100 text-emerald-800' :
                      log.status === 'TEST' ? 'bg-purple-100 text-purple-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {log.status === 'SENT' ? 'Enviado' : log.status === 'TEST' ? 'Teste' : 'Falha'}
                    </span>
                  </td>
                </tr>
              ))}
              {pushLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-bold italic">
                    Nenhum disparo de notificação registrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PushManager;
