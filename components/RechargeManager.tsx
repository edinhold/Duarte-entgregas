import React, { useState } from 'react';
import { RechargeCode, UserProfile, UserRole } from '../types';

interface RechargeManagerProps {
  rechargeCodes: RechargeCode[];
  merchants: UserProfile[];
  onCreateCode: (codeData: Omit<RechargeCode, 'id' | 'code' | 'status' | 'createdAt' | 'usedCount' | 'usageLogs'>) => void;
  onCancelCode: (codeId: string) => void;
}

const RechargeManager: React.FC<RechargeManagerProps> = ({
  rechargeCodes,
  merchants,
  onCreateCode,
  onCancelCode
}) => {
  const [amount, setAmount] = useState<number>(50);
  const [usageType, setUsageType] = useState<'SINGLE' | 'MULTIPLE'>('SINGLE');
  const [maxUses, setMaxUses] = useState<number>(1);
  const [expirationDate, setExpirationDate] = useState<string>(() => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    return nextMonth.toISOString().split('T')[0];
  });
  const [targetMerchantId, setTargetMerchantId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Informe um valor de recarga válido.');
      return;
    }
    onCreateCode({
      amount,
      usageType,
      maxUses: usageType === 'SINGLE' ? 1 : Math.max(1, maxUses),
      expirationDate,
      targetMerchantId: targetMerchantId || undefined,
      note: note || undefined
    });

    setNote('');
    alert('Código de recarga gerado com sucesso!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Código ${text} copiado para a área de transferência!`);
  };

  const handlePrintCode = (item: RechargeCode) => {
    const printWindow = window.open('', '_blank', 'width=600,height=400');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Voucher de Recarga Duarte Delivery</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; background: #fafafa; }
            .card { border: 3px dashed #312e81; padding: 30px; background: white; border-radius: 20px; display: inline-block; max-width: 450px; }
            h1 { color: #312e81; margin-bottom: 5px; font-size: 24px; }
            .badge { background: #e0e7ff; color: #312e81; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 12px; }
            .code { font-size: 28px; font-family: monospace; font-weight: 900; letter-spacing: 3px; color: #1e1b4b; background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 20px 0; border: 1px solid #ddd; }
            .amount { font-size: 32px; font-weight: 900; color: #059669; }
            .footer { font-size: 11px; color: #6b7280; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>DUARTE DELIVERY</h1>
            <span class="badge">VOUCHER DE CRÉDITO</span>
            <div class="code">${item.code}</div>
            <div class="amount">R$ ${item.amount.toFixed(2)}</div>
            <p style="font-size: 12px; color: #4b5563;">Válido até: <strong>${new Date(item.expirationDate).toLocaleDateString('pt-BR')}</strong></p>
            ${item.note ? `<p style="font-size: 11px; font-style: italic; color: #6b7280;">Obs: ${item.note}</p>` : ''}
            <div class="footer">Resgate este código no painel de Lojista Duarte Delivery na aba Carteira.</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const filteredCodes = rechargeCodes.filter(item => {
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.code.toLowerCase().includes(q) ||
        (item.note && item.note.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Form Criar Código */}
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center font-bold">
            <i className="fas fa-ticket-alt"></i>
          </div>
          <div>
            <h3 className="text-xl font-black text-indigo-950">Gerador de Códigos de Recarga</h3>
            <p className="text-xs text-slate-400 font-medium">Crie vouchers de crédito para lojistas abaterem em corridas e entregas.</p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
              Valor do Crédito (R$) *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 font-bold text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-lg text-slate-800 outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
              Tipo de Utilização
            </label>
            <select
              value={usageType}
              onChange={(e) => setUsageType(e.target.value as any)}
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-indigo-600"
            >
              <option value="SINGLE">Uso Único (1 uso)</option>
              <option value="MULTIPLE">Uso Múltiplo (Vários lojistas)</option>
            </select>
          </div>

          {usageType === 'MULTIPLE' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                Limite Máximo de Usos
              </label>
              <input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-indigo-600"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
              Data de Validade *
            </label>
            <input
              type="date"
              required
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-indigo-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
              Lojista Destinatário (Opcional)
            </label>
            <select
              value={targetMerchantId}
              onChange={(e) => setTargetMerchantId(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm text-slate-800 outline-none focus:border-indigo-600"
            >
              <option value="">Qualquer Lojista</option>
              {merchants.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
              Observação interna (Ex: Promoção Inauguração)
            </label>
            <input
              type="text"
              placeholder="Digite um motivo ou anotação..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl font-medium text-sm text-slate-800 outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex items-end md:col-span-1">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-wider py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center space-x-2"
            >
              <i className="fas fa-plus-circle"></i>
              <span>Gerar Código</span>
            </button>
          </div>
        </form>
      </div>

      {/* Histórico e Gestão de Códigos */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm space-y-4">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
          <div>
            <h4 className="font-black text-indigo-950 uppercase text-xs tracking-widest">Códigos de Recarga Cadastrados</h4>
            <p className="text-xs text-slate-400">Gerencie status, impressões e veja o histórico de utilizações.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar por código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-600"
            />

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-600"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ACTIVE">Ativos</option>
              <option value="USED">Utilizados</option>
              <option value="CANCELLED">Cancelados</option>
              <option value="EXPIRED">Expirados</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Tipo & Usos</th>
                <th className="px-6 py-4">Validade</th>
                <th className="px-6 py-4">Destinatário</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredCodes.map(item => {
                const targetMerchant = merchants.find(m => m.id === item.targetMerchantId);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-indigo-950 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs tracking-wider">
                          {item.code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(item.code)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                          title="Copiar Código"
                        >
                          <i className="fas fa-copy text-xs"></i>
                        </button>
                      </div>
                      {item.note && (
                        <p className="text-[10px] text-slate-400 mt-1 italic">{item.note}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-black text-emerald-600 text-base">
                      R$ {item.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      <span className="font-bold text-slate-700">
                        {item.usageType === 'SINGLE' ? 'Único' : 'Múltiplo'}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {item.usedCount} de {item.maxUses} uso(s)
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                      {new Date(item.expirationDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                      {targetMerchant ? targetMerchant.name : 'Qualquer Lojista'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                        item.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'USED' ? 'bg-blue-100 text-blue-800' :
                        item.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {item.status === 'ACTIVE' ? 'Ativo' :
                         item.status === 'USED' ? 'Utilizado' :
                         item.status === 'CANCELLED' ? 'Cancelado' : 'Expirado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handlePrintCode(item)}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                        title="Imprimir Voucher"
                      >
                        <i className="fas fa-print"></i>
                      </button>
                      {item.status === 'ACTIVE' && (
                        <button
                          onClick={() => {
                            if (confirm(`Deseja cancelar a recarga ${item.code}?`)) {
                              onCancelCode(item.id);
                            }
                          }}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors"
                          title="Cancelar Recarga"
                        >
                          <i className="fas fa-ban"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredCodes.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-bold italic">
                    Nenhum código de recarga encontrado.
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

export default RechargeManager;
