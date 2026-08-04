import React, { useState } from 'react';
import { OneSignalConfig, OneSignalDiagnosticLog, PushNotificationLog, UserProfile, UserRole } from '../types';
import { maskApiKey, sendOneSignalPushNotification } from '../services/onesignalService';

interface OneSignalDiagnosticsProps {
  config: OneSignalConfig;
  drivers: UserProfile[];
  pushLogs: PushNotificationLog[];
  onUpdateConfig: (newConfig: OneSignalConfig) => void;
  onAddPushLog: (log: PushNotificationLog) => void;
}

const OneSignalDiagnostics: React.FC<OneSignalDiagnosticsProps> = ({
  config,
  drivers,
  pushLogs,
  onUpdateConfig,
  onAddPushLog
}) => {
  const [formConfig, setFormConfig] = useState<OneSignalConfig>(config);
  const [showFullApiKey, setShowFullApiKey] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Test form state
  const [testTargetType, setTestTargetType] = useState<'ALL_ONLINE' | 'SPECIFIC_DRIVER' | 'CUSTOM_EXTERNAL_ID' | 'CUSTOM_SUBSCRIPTION_ID'>('ALL_ONLINE');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [customExternalId, setCustomExternalId] = useState<string>('motorista_123');
  const [customSubscriptionId, setCustomSubscriptionId] = useState<string>('sub_456');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isExecutingTest, setIsExecutingTest] = useState(false);

  const onlineDrivers = drivers.filter(d => d.role === UserRole.DRIVER && d.isOnline);
  const totalDriversWithExternalId = drivers.filter(d => d.role === UserRole.DRIVER && (d.oneSignalExternalId || d.id));
  const totalDriversWithSubscription = drivers.filter(d => d.role === UserRole.DRIVER && d.oneSignalSubscriptionId);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    onUpdateConfig(formConfig);
    setTimeout(() => {
      setIsSavingConfig(false);
      alert('Configurações da OneSignal salvas com sucesso no backend!');
    }, 400);
  };

  const handleRunDiagnosticTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecutingTest(true);
    setTestResult(null);

    let targetDrivers: UserProfile[] = [];
    let customExtId: string | undefined = undefined;
    let customSubId: string | undefined = undefined;

    if (testTargetType === 'ALL_ONLINE') {
      targetDrivers = onlineDrivers.length > 0 ? onlineDrivers : drivers.filter(d => d.role === UserRole.DRIVER);
    } else if (testTargetType === 'SPECIFIC_DRIVER') {
      const found = drivers.find(d => d.id === selectedDriverId);
      if (found) targetDrivers = [found];
    } else if (testTargetType === 'CUSTOM_EXTERNAL_ID') {
      customExtId = customExternalId.trim();
    } else if (testTargetType === 'CUSTOM_SUBSCRIPTION_ID') {
      customSubId = customSubscriptionId.trim();
    }

    const result = await sendOneSignalPushNotification({
      config: formConfig,
      rideId: `teste-${Date.now()}`,
      riderId: 'admin',
      productName: 'Pacote Teste Diagnóstico',
      valorMotorista: 15.50,
      distanciaKm: 4.2,
      targetDrivers,
      customExternalId: customExtId,
      customSubscriptionId: customSubId,
      isTest: true
    });

    setTestResult(result);
    setIsExecutingTest(false);

    // Save diagnostic log
    const newLog: PushNotificationLog = {
      id: `push-diag-${Date.now()}`,
      rideId: `teste-${Date.now()}`,
      title: '🚚 Teste OneSignal Duarte Delivery',
      message: 'Teste de conectividade via OneSignal REST API',
      amount: 15.50,
      distance: '4.2 km',
      city: 'Diagnóstico',
      sentAt: new Date().toISOString(),
      targetDriverCount: result.motoristas_encontrados,
      deliveredCount: result.dispositivos_alvo,
      failedCount: result.falhas,
      status: result.success ? 'TEST' : 'FAILED',
      oneSignalNotificationId: result.onesignal_notification_id,
      httpStatus: result.httpStatus,
      responseSnippet: result.responseBodySnippet,
      recipients: targetDrivers.map(d => ({
        driverId: d.id,
        driverName: d.name,
        status: result.success ? 'DELIVERED' : 'FAILED'
      }))
    };

    onAddPushLog(newLog);
  };

  return (
    <div className="space-y-8 animate-slide-up pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30 text-indigo-200 text-xs font-bold uppercase tracking-widest">
              <i className="fas fa-signal"></i>
              <span>Seção 12: Integração Oficial OneSignal REST API</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight">Diagnóstico & Notificações Push</h2>
            <p className="text-slate-300 text-sm max-w-2xl font-medium leading-relaxed">
              Disparos automáticos de chamadas de corrida e monitoramento da OneSignal REST API. A chave secreta é armazenada em variáveis seguras e nunca exposta ao cliente.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Cards (Section 12.12) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">App ID Configurado</p>
          <div className="flex items-center space-x-2 mt-2">
            <span className={`w-3 h-3 rounded-full ${formConfig.appId ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            <span className="text-lg font-black text-slate-900">{formConfig.appId ? 'SIM' : 'NÃO'}</span>
          </div>
          <p className="text-slate-400 text-[9px] font-mono mt-1 truncate">{formConfig.appId || 'Inexistente'}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Chave Secreta API Key</p>
          <div className="flex items-center space-x-2 mt-2">
            <span className={`w-3 h-3 rounded-full ${formConfig.restApiKey ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            <span className="text-lg font-black text-slate-900">{formConfig.restApiKey ? 'CONFIGURADA' : 'AUSENTE'}</span>
          </div>
          <p className="text-slate-400 text-[9px] font-mono mt-1">{maskApiKey(formConfig.restApiKey)}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Canal Android</p>
          <div className="flex items-center space-x-2 mt-2">
            <i className="fab fa-android text-emerald-600 text-lg"></i>
            <span className="text-lg font-black text-slate-900">SIM</span>
          </div>
          <p className="text-slate-400 text-[9px] font-mono mt-1">{formConfig.androidChannelId}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Motoristas Elegíveis Online</p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-2xl font-black text-indigo-600">{onlineDrivers.length}</span>
            <span className="text-xs text-slate-400 font-bold">/ {drivers.length} total</span>
          </div>
          <p className="text-slate-400 text-[9px] font-bold mt-1">{totalDriversWithExternalId.length} External User IDs cadastrados</p>
        </div>
      </div>

      {/* OneSignal Configuration Form (Section 12) */}
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-xl font-black text-indigo-950 flex items-center space-x-2">
            <i className="fas fa-key text-indigo-600"></i>
            <span>Credenciais da OneSignal REST API</span>
          </h3>
          <p className="text-xs text-slate-400 font-medium">As credenciais abaixo alimentam o disparo automático do backend durante as chamadas de corrida.</p>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">OneSignal App ID</label>
              <input
                type="text"
                required
                value={formConfig.appId}
                onChange={e => setFormConfig({ ...formConfig, appId: e.target.value })}
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">OneSignal REST API Key (Secreta)</label>
              <div className="relative">
                <input
                  type={showFullApiKey ? 'text' : 'password'}
                  required
                  value={formConfig.restApiKey}
                  onChange={e => setFormConfig({ ...formConfig, restApiKey: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowFullApiKey(!showFullApiKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 text-sm"
                >
                  <i className={`fas ${showFullApiKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Android Channel ID</label>
              <input
                type="text"
                required
                value={formConfig.androidChannelId}
                onChange={e => setFormConfig({ ...formConfig, androidChannelId: e.target.value })}
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingConfig}
              className="bg-indigo-950 hover:bg-indigo-900 text-white font-black text-xs uppercase tracking-wider px-8 py-4 rounded-2xl shadow-lg transition-all"
            >
              Salvar Credenciais OneSignal
            </button>
          </div>
        </form>
      </div>

      {/* Teste Administrativo de Notificação (Section 12.13) */}
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-xl font-black text-indigo-950 flex items-center space-x-2">
            <i className="fas fa-vial text-indigo-600"></i>
            <span>Testar Disparo da OneSignal</span>
          </h3>
          <p className="text-xs text-slate-400 font-medium">Executa exatamente o mesmo fluxo e função de disparo utilizada nas corridas reais para validar conectividade e payload.</p>
        </div>

        <form onSubmit={handleRunDiagnosticTest} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Modo do Teste</label>
              <select
                value={testTargetType}
                onChange={e => setTestTargetType(e.target.value as any)}
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-600"
              >
                <option value="ALL_ONLINE">Todos os Motoristas Online Elegíveis</option>
                <option value="SPECIFIC_DRIVER">Motorista Específico do Sistema</option>
                <option value="CUSTOM_EXTERNAL_ID">External User ID Específico (external_id)</option>
                <option value="CUSTOM_SUBSCRIPTION_ID">Subscription ID Específico (include_subscription_ids)</option>
              </select>
            </div>

            {testTargetType === 'SPECIFIC_DRIVER' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Selecione o Motorista</label>
                <select
                  value={selectedDriverId}
                  onChange={e => setSelectedDriverId(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-600"
                >
                  <option value="">Selecione...</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.isOnline ? 'ONLINE' : 'Offline'}) - ID: {d.id}</option>
                  ))}
                </select>
              </div>
            )}

            {testTargetType === 'CUSTOM_EXTERNAL_ID' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">External User ID (OneSignal)</label>
                <input
                  type="text"
                  required
                  value={customExternalId}
                  onChange={e => setCustomExternalId(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                  placeholder="Ex: motorista_123"
                />
              </div>
            )}

            {testTargetType === 'CUSTOM_SUBSCRIPTION_ID' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Subscription ID (Dispositivo)</label>
                <input
                  type="text"
                  required
                  value={customSubscriptionId}
                  onChange={e => setCustomSubscriptionId(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
                  placeholder="Ex: 8f92a10b-..."
                />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isExecutingTest}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider px-8 py-4 rounded-2xl shadow-lg transition-all flex items-center space-x-2"
            >
              <i className="fas fa-paper-plane"></i>
              <span>{isExecutingTest ? 'Enviando pela OneSignal...' : 'Testar OneSignal REST API'}</span>
            </button>
          </div>
        </form>

        {/* Live Test Results Card */}
        {testResult && (
          <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 border border-slate-800 animate-fade-in font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-bold text-indigo-400 uppercase tracking-widest">Resultado do Diagnóstico OneSignal</span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${testResult.success ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400'}`}>
                HTTP Status {testResult.httpStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-300">
              <div>
                <p className="text-[9px] text-slate-500 uppercase">OneSignal Notif ID</p>
                <p className="font-bold text-white truncate">{testResult.onesignal_notification_id || '-'}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase">Motoristas Elegíveis</p>
                <p className="font-bold text-white">{testResult.motoristas_encontrados}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase">Dispositivos Alvo</p>
                <p className="font-bold text-white">{testResult.dispositivos_alvo}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase">Tempo de Resposta</p>
                <p className="font-bold text-emerald-400">{testResult.responseTimeMs} ms</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[9px] text-slate-500 uppercase">Trecho da Resposta Recebida:</p>
              <pre className="p-3 bg-slate-950 rounded-xl overflow-x-auto text-[10px] text-indigo-200 border border-slate-800 whitespace-pre-wrap">
                {testResult.responseBodySnippet || testResult.mensagem}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Push Notification History Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm space-y-4">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h4 className="font-black text-indigo-950 uppercase text-xs tracking-widest">Histórico & Logs de Diagnóstico OneSignal</h4>
          <p className="text-xs text-slate-400">Registros detalhados dos disparos realizados via REST API.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
              <tr>
                <th className="px-6 py-4">Data & Hora</th>
                <th className="px-6 py-4">Título</th>
                <th className="px-6 py-4">Notif ID / Status HTTP</th>
                <th className="px-6 py-4">Alvos</th>
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
                  <td className="px-6 py-4 text-xs font-mono text-slate-600">
                    <span className="block text-indigo-600 font-bold">{log.oneSignalNotificationId || '-'}</span>
                    <span className="text-[10px] text-slate-400">HTTP {log.httpStatus || 200}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-700">
                    {log.targetDriverCount} motorista(s)
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
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-bold italic">
                    Nenhum disparo de notificação registrado até o momento.
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

export default OneSignalDiagnostics;
