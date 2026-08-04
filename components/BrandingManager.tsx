import React, { useState } from 'react';
import { BrandingSettings } from '../types';
import { validateBrandingImage, readFileAsDataURL, DEFAULT_BRANDING_SETTINGS } from '../services/brandingService';

interface BrandingManagerProps {
  branding: BrandingSettings;
  onUpdateBranding: (newBranding: BrandingSettings) => void;
}

const BrandingManager: React.FC<BrandingManagerProps> = ({ branding, onUpdateBranding }) => {
  const [formState, setFormState] = useState<BrandingSettings>(branding);
  const [selectedFileType, setSelectedFileType] = useState<keyof BrandingSettings | null>(null);
  const [dragActive, setDragActive] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Active crop/fit ratio selection
  const [activeCropRatio, setActiveCropRatio] = useState<'FREE' | 'SQUARE' | 'HORIZONTAL'>('HORIZONTAL');

  const handleTextChange = (field: keyof BrandingSettings, value: string) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File, targetKey: keyof BrandingSettings) => {
    setUploadError(null);
    setUploadSuccess(null);
    setIsProcessing(true);

    const validation = validateBrandingImage(file);
    if (!validation.isValid) {
      setUploadError(validation.errorMsg || 'Erro na validação da imagem.');
      setIsProcessing(false);
      return;
    }

    try {
      const dataUrl = await readFileAsDataURL(file);
      setFormState(prev => ({
        ...prev,
        [targetKey]: dataUrl,
        updatedAt: new Date().toISOString()
      }));
      setUploadSuccess(`Imagem para "${targetKey}" processada e carregada com sucesso!`);
    } catch (err: any) {
      setUploadError(err.message || 'Não foi possível processar esta imagem. Selecione outro arquivo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetKey: keyof BrandingSettings) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0], targetKey);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(targetKey);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('Deseja realmente restaurar a logo e a identidade visual padrão do Duarte Delivery?')) {
      setFormState(DEFAULT_BRANDING_SETTINGS);
      onUpdateBranding(DEFAULT_BRANDING_SETTINGS);
      setUploadSuccess('Imagem removida. A logo e cores padrão foram restauradas com sucesso.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBranding(formState);
    setUploadSuccess('Identidade visual e logotipo do Duarte Delivery atualizados com sucesso!');
  };

  return (
    <div className="space-y-8 animate-slide-up pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 text-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30 text-indigo-200 text-xs font-bold uppercase tracking-widest">
              <i className="fas fa-paint-brush"></i>
              <span>Seção 18: Personalização e Branding</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight">Aparência e Identidade Visual</h2>
            <p className="text-slate-300 text-sm max-w-2xl font-medium leading-relaxed">
              Configure as logos, ícones do PWA, imagem de fundo e cores do sistema. As alterações são aplicadas automaticamente nos painéis do Administrador, Lojista e Motorista.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="self-start md:self-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 shrink-0 active:scale-95"
          >
            <i className="fas fa-undo"></i>
            <span>Restaurar Padrões</span>
          </button>
        </div>
      </div>

      {/* Error & Success Feedback Banners */}
      {uploadError && (
        <div className="p-5 bg-red-50 border-2 border-red-200 text-red-700 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <i className="fas fa-exclamation-triangle text-xl shrink-0"></i>
            <span className="font-bold text-sm">{uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="text-red-500 hover:text-red-700">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {uploadSuccess && (
        <div className="p-5 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <i className="fas fa-check-circle text-xl shrink-0"></i>
            <span className="font-bold text-sm">{uploadSuccess}</span>
          </div>
          <button onClick={() => setUploadSuccess(null)} className="text-emerald-600 hover:text-emerald-800">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic System Info */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-indigo-950 uppercase tracking-tight flex items-center space-x-2">
            <i className="fas fa-signature text-indigo-600"></i>
            <span>Nome e Apresentação do Sistema</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Nome do Sistema</label>
              <input
                type="text"
                required
                value={formState.systemName}
                onChange={e => handleTextChange('systemName', e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Texto Alternativo (Alt Text Accessibility)</label>
              <input
                type="text"
                required
                value={formState.altText}
                onChange={e => handleTextChange('altText', e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-600"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Texto de Apresentação / Slogan</label>
              <input
                type="text"
                required
                value={formState.presentationText}
                onChange={e => handleTextChange('presentationText', e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium text-slate-800 outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Upload Dropzones Grid */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-indigo-950 uppercase tracking-tight flex items-center space-x-2">
                <i className="fas fa-cloud-upload-alt text-indigo-600"></i>
                <span>Logotipos & Imagens da Aplicação</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">Aceita PNG com transparência, JPG e JPEG. Limite máximo: 5 MB por arquivo.</p>
            </div>

            {/* Ratio Presets */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveCropRatio('HORIZONTAL')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeCropRatio === 'HORIZONTAL' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Horizontal (3:1)
              </button>
              <button
                type="button"
                onClick={() => setActiveCropRatio('SQUARE')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeCropRatio === 'SQUARE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Quadrado (1:1)
              </button>
              <button
                type="button"
                onClick={() => setActiveCropRatio('FREE')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${activeCropRatio === 'FREE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Livre
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Logo Principal */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-950">Logo Principal</span>
                <span className="text-[10px] text-slate-400 font-mono font-bold">1200 x 400 px</span>
              </div>

              <div
                onDragOver={e => handleDragOver(e, 'mainLogo')}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, 'mainLogo')}
                className={`relative border-2 border-dashed rounded-3xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[160px] bg-slate-50/80 hover:bg-slate-50 ${
                  dragActive === 'mainLogo' ? 'border-indigo-600 bg-indigo-50/50 scale-[1.02]' : 'border-slate-200'
                }`}
              >
                {formState.mainLogo ? (
                  <div className="space-y-3 w-full flex flex-col items-center">
                    <img src={formState.mainLogo} alt={formState.altText} className="max-h-20 object-contain shadow-sm p-1 rounded-xl bg-white border border-slate-100" />
                    <label className="cursor-pointer bg-white hover:bg-slate-100 text-indigo-950 border border-slate-200 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-all shadow-sm">
                      Substituir Logo
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'mainLogo')}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl">
                      <i className="fas fa-image"></i>
                    </div>
                    <span className="text-xs font-bold text-slate-700">Arraste ou Clique para Selecionar</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG ou JPEG (máx. 5MB)</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'mainLogo')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 2. Logo Fundo Claro */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-950">Logo (Fundo Claro)</span>
                <span className="text-[10px] text-slate-400 font-mono font-bold">Modo Light</span>
              </div>

              <div
                onDragOver={e => handleDragOver(e, 'lightBgLogo')}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, 'lightBgLogo')}
                className={`relative border-2 border-dashed rounded-3xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[160px] bg-slate-100/90 hover:bg-slate-100 ${
                  dragActive === 'lightBgLogo' ? 'border-indigo-600 bg-indigo-50/50 scale-[1.02]' : 'border-slate-200'
                }`}
              >
                {formState.lightBgLogo ? (
                  <div className="space-y-3 w-full flex flex-col items-center">
                    <img src={formState.lightBgLogo} alt={formState.altText} className="max-h-20 object-contain p-1 rounded-xl bg-white border border-slate-200 shadow-sm" />
                    <label className="cursor-pointer bg-white hover:bg-slate-200 text-slate-800 border border-slate-300 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-all">
                      Substituir
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'lightBgLogo')}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center space-y-2">
                    <i className="fas fa-sun text-amber-500 text-2xl"></i>
                    <span className="text-xs font-bold text-slate-700">Selecione Imagem</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'lightBgLogo')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 3. Logo Fundo Escuro */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-950">Logo (Fundo Escuro)</span>
                <span className="text-[10px] text-slate-400 font-mono font-bold">Modo Dark</span>
              </div>

              <div
                onDragOver={e => handleDragOver(e, 'darkBgLogo')}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, 'darkBgLogo')}
                className={`relative border-2 border-dashed rounded-3xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[160px] bg-slate-900 text-white ${
                  dragActive === 'darkBgLogo' ? 'border-indigo-400 scale-[1.02]' : 'border-slate-700'
                }`}
              >
                {formState.darkBgLogo ? (
                  <div className="space-y-3 w-full flex flex-col items-center">
                    <img src={formState.darkBgLogo} alt={formState.altText} className="max-h-20 object-contain p-1 rounded-xl bg-slate-800 border border-slate-700" />
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-all">
                      Substituir
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'darkBgLogo')}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center space-y-2">
                    <i className="fas fa-moon text-indigo-300 text-2xl"></i>
                    <span className="text-xs font-bold text-slate-200">Selecione Imagem</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'darkBgLogo')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 4. Ícone Reduzido / PWA */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-950">Ícone PWA / Mobile</span>
                <span className="text-[10px] text-slate-400 font-mono font-bold">512 x 512 px</span>
              </div>

              <div
                onDragOver={e => handleDragOver(e, 'pwaIcon')}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, 'pwaIcon')}
                className={`relative border-2 border-dashed rounded-3xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[160px] bg-slate-50 hover:bg-slate-100/80 ${
                  dragActive === 'pwaIcon' ? 'border-indigo-600 scale-[1.02]' : 'border-slate-200'
                }`}
              >
                {formState.pwaIcon ? (
                  <div className="space-y-3 w-full flex flex-col items-center">
                    <img src={formState.pwaIcon} alt={formState.altText} className="w-16 h-16 object-cover rounded-2xl border-2 border-white shadow-md" />
                    <label className="cursor-pointer bg-white hover:bg-slate-100 text-indigo-950 border border-slate-200 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-all shadow-sm">
                      Substituir Ícone
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'pwaIcon')}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center space-y-2">
                    <i className="fas fa-mobile-alt text-indigo-600 text-2xl"></i>
                    <span className="text-xs font-bold text-slate-700">Carregar Ícone PWA</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'pwaIcon')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 5. Imagem Fundo da Tela de Login */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-950">Imagem de Fundo da Tela de Login</span>
                <span className="text-[10px] text-slate-400 font-mono font-bold">Fundo do Portal</span>
              </div>

              <div
                onDragOver={e => handleDragOver(e, 'loginBgImage')}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, 'loginBgImage')}
                className={`relative border-2 border-dashed rounded-3xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[160px] bg-slate-900 overflow-hidden ${
                  dragActive === 'loginBgImage' ? 'border-indigo-400 scale-[1.02]' : 'border-slate-700'
                }`}
              >
                {formState.loginBgImage && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-40"
                    style={{ backgroundImage: `url(${formState.loginBgImage})` }}
                  />
                )}

                <div className="relative z-10 space-y-3 flex flex-col items-center text-white">
                  <p className="text-xs font-bold text-slate-200">Imagem de Destaque na Tela de Login & Autenticação</p>
                  <label className="cursor-pointer bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30 text-[10px] font-black uppercase px-4 py-2 rounded-xl transition-all shadow-lg">
                    {formState.loginBgImage ? 'Substituir Fundo' : 'Enviar Imagem de Fundo'}
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'loginBgImage')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette Customization */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-indigo-950 uppercase tracking-tight flex items-center space-x-2">
            <i className="fas fa-palette text-indigo-600"></i>
            <span>Paleta de Cores & Temas Visuais</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Cor Principal</label>
              <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-2xl border-2 border-slate-100">
                <input
                  type="color"
                  value={formState.primaryColor}
                  onChange={e => handleTextChange('primaryColor', e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={formState.primaryColor}
                  onChange={e => handleTextChange('primaryColor', e.target.value)}
                  className="w-full bg-transparent font-mono font-bold text-xs uppercase outline-none text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Cor Secundária</label>
              <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-2xl border-2 border-slate-100">
                <input
                  type="color"
                  value={formState.secondaryColor}
                  onChange={e => handleTextChange('secondaryColor', e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={formState.secondaryColor}
                  onChange={e => handleTextChange('secondaryColor', e.target.value)}
                  className="w-full bg-transparent font-mono font-bold text-xs uppercase outline-none text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Cor dos Botões</label>
              <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-2xl border-2 border-slate-100">
                <input
                  type="color"
                  value={formState.buttonColor}
                  onChange={e => handleTextChange('buttonColor', e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={formState.buttonColor}
                  onChange={e => handleTextChange('buttonColor', e.target.value)}
                  className="w-full bg-transparent font-mono font-bold text-xs uppercase outline-none text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Cor do Menu Lateral</label>
              <div className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-2xl border-2 border-slate-100">
                <input
                  type="color"
                  value={formState.sidebarColor}
                  onChange={e => handleTextChange('sidebarColor', e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  value={formState.sidebarColor}
                  onChange={e => handleTextChange('sidebarColor', e.target.value)}
                  className="w-full bg-transparent font-mono font-bold text-xs uppercase outline-none text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Context Live Preview Panel (Section 18.4) */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-indigo-950 uppercase tracking-tight flex items-center space-x-2">
              <i className="fas fa-desktop text-indigo-600"></i>
              <span>Pré-Visualização em Tempo Real (Live Preview Multi-Contexto)</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">Veja exatamente como a logo e o branding ficarão nos diferentes elementos da plataforma antes de publicar.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Preview 1: Header Dashboard */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">1. Cabeçalho do Painel</span>
              <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-white" style={{ backgroundColor: formState.headerColor }}>
                <div className="flex items-center space-x-3">
                  <img src={formState.pwaIcon || formState.mainLogo} alt={formState.altText} className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
                  <span className="font-bold text-sm">{formState.systemName}</span>
                </div>
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-xs">
                  <i className="fas fa-user"></i>
                </div>
              </div>
            </div>

            {/* Preview 2: Menu Lateral (Sidebar) */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">2. Menu Lateral</span>
              <div className="p-4 rounded-2xl border border-slate-200 text-white space-y-3" style={{ backgroundColor: formState.sidebarColor }}>
                <div className="flex items-center space-x-2">
                  <img src={formState.pwaIcon || formState.mainLogo} alt={formState.altText} className="w-8 h-8 rounded-lg object-contain bg-white p-0.5" />
                  <div>
                    <p className="font-bold text-xs leading-tight">{formState.systemName}</p>
                    <p className="text-[9px] opacity-60 uppercase font-bold">LOJISTA</p>
                  </div>
                </div>
                <div className="space-y-1 pt-1">
                  <div className="bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-2">
                    <i className="fas fa-paper-plane text-xs"></i>
                    <span>Chamar Motorista</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview 3: Card de Ação do Motorista */}
            <div className="space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">3. Botão Principal</span>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <button
                  type="button"
                  className="w-full text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition-all"
                  style={{ backgroundColor: formState.buttonColor }}
                >
                  Confirmar e Chamar Motoristas
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isProcessing}
            className="bg-indigo-950 hover:bg-indigo-900 text-white py-5 px-10 rounded-[2rem] font-black text-sm uppercase tracking-wider shadow-2xl transition-all active:scale-95 flex items-center space-x-3"
          >
            <i className="fas fa-save text-lg"></i>
            <span>SALVAR IDENTIDADE VISUAL E LOGOTIPOS</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default BrandingManager;
