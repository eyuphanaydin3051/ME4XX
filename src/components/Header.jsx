// src/components/Header.jsx
import React from 'react';
import {
  Calendar,
  RefreshCw,
  Sparkles,
  BookOpen,
  Trash2,
  HelpCircle,
  FileText,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Header({
  metadata,
  onResetAll,
  onSyncData,
  isSyncing,
  syncMessage,
  onOpenHelp,
  onOpenRegistrationGuide,
}) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-red-900/20 dark:shadow-red-900/30">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white m-0">
                ODTÜ ME Ders Programı
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                Makina Mühendisliği (569)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
              {metadata?.semesterName || '2026-2027 Fall'} &bull; ME4 Teknik Seçmeli Optimizatörü
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {syncMessage && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
              {syncMessage}
            </span>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Aydınlık Temaya Geç' : 'Karanlık Temaya Geç'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Aydınlık</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Karanlık</span>
              </>
            )}
          </button>

          <button
            onClick={onSyncData}
            disabled={isSyncing}
            title="Ders verilerini robotdegilim CDN üzerinden güncelle"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-500 dark:text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Güncelleniyor...' : 'Veri Güncelle'}</span>
          </button>

          <button
            onClick={onOpenRegistrationGuide}
            title="2026-2027 Fall 4xx Dersleri Kayıt Bilgisi ve Form Linkleri"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 dark:bg-purple-500/20 dark:hover:bg-purple-500/30 text-purple-700 dark:text-purple-200 shadow-sm transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-300" />
            <span>4xx Kayıt Bilgisi</span>
          </button>

          <button
            onClick={onOpenHelp}
            title="Nasıl kullanılır?"
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onResetAll}
            title="Tüm seçimleri ve blokları sıfırla"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sıfırla</span>
          </button>
        </div>
      </div>
    </header>
  );
}
