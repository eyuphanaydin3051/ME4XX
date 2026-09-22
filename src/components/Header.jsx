// src/components/Header.jsx
import React from 'react';
import { Calendar, RefreshCw, Sparkles, BookOpen, Trash2, HelpCircle } from 'lucide-react';

export default function Header({
  metadata,
  onResetAll,
  onSyncData,
  isSyncing,
  syncMessage,
  onOpenHelp,
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-red-900/30">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white m-0">
                ODTÜ ME Ders Programı
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                Makina Mühendisliği (569)
              </span>
            </div>
            <p className="text-xs text-slate-400 m-0">
              {metadata?.semesterName || '2026-2027 Fall'} &bull; ME4 Teknik Seçmeli Optimizatörü
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {syncMessage && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
              {syncMessage}
            </span>
          )}

          <button
            onClick={onSyncData}
            disabled={isSyncing}
            title="Ders verilerini robotdegilim CDN üzerinden güncelle"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800 hover:bg-slate-700/80 text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{isSyncing ? 'Güncelleniyor...' : 'Veri Güncelle'}</span>
          </button>

          <button
            onClick={onOpenHelp}
            title="Nasıl kullanılır?"
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onResetAll}
            title="Tüm seçimleri ve blokları sıfırla"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sıfırla</span>
          </button>
        </div>
      </div>
    </header>
  );
}
