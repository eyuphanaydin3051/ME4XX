// src/components/RegistrationGuideModal.jsx
import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  ExternalLink,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Filter,
} from 'lucide-react';
import { getAllRegistrationInfo, REG_TYPE_CONFIG } from '../utils/registration';

export default function RegistrationGuideModal({ isOpen, onClose }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const allRegData = useMemo(() => getAllRegistrationInfo(), []);

  const filteredData = useMemo(() => {
    return allRegData.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const codeMatch = item.code.toLowerCase().includes(q);
        const taMatch = item.assistant.toLowerCase().includes(q);
        const notesMatch = (item.notes || '').toLowerCase().includes(q);
        if (!codeMatch && !taMatch && !notesMatch) return false;
      }
      return true;
    });
  }, [allRegData, search, filterType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col text-slate-800 dark:text-slate-100 transition-colors">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
                  2026-2027 Fall 4xx Dersleri Kayıt Bilgisi
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 font-semibold">
                  Resmi Bölüm Duyurusu
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                ODTÜ Makina Mühendisliği 4. sınıf teknik seçmeli derslerinin asistanları, kayıt yöntemleri ve form linkleri
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ders kodu, asistan veya şart ara (örn: 402, 438, transkript)..."
              value={search}
              onChange={(e) => setSearch}
              onInput={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all border ${
                filterType === 'all'
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Tümü ({allRegData.length})
            </button>
            <button
              onClick={() => setFilterType('form')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all border ${
                filterType === 'form'
                  ? 'bg-purple-600 border-purple-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Google Form ({allRegData.filter((i) => i.type === 'form').length})
            </button>
            <button
              onClick={() => setFilterType('interactive')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all border ${
                filterType === 'interactive'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              İnteraktif Kayıt ({allRegData.filter((i) => i.type === 'interactive').length})
            </button>
            <button
              onClick={() => setFilterType('prereq_attend')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all border ${
                filterType === 'prereq_attend'
                  ? 'bg-amber-600 border-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Şartlı / İlk Ders
            </button>
          </div>
        </div>

        {/* Scrollable Table / Cards */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
          {filteredData.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Arama kriterinize uygun ders kayıt bilgisi bulunamadı.
            </div>
          ) : (
            filteredData.map((item) => {
              const typeCfg = REG_TYPE_CONFIG[item.type] || REG_TYPE_CONFIG.form;

              return (
                <div
                  key={item.code}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  {/* Left: Code, TA, and Type Badge */}
                  <div className="space-y-1.5 min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-amber-600 dark:text-amber-300">
                        {item.code}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${typeCfg.badgeClass}`}
                      >
                        {typeCfg.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                      <span>Asistan: {item.assistant}</span>
                      <a
                        href={`mailto:${item.email}?subject=${encodeURIComponent(
                          item.code + ' Kayıt Hakkında'
                        )}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-0.5 text-[11px]"
                        title={`${item.assistant} kişisine e-posta gönder`}
                      >
                        <Mail className="w-3 h-3 inline" />
                        <span>{item.email}</span>
                      </a>
                    </div>
                  </div>

                  {/* Center: Requirements / Notes */}
                  <div className="flex-1 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    <p className="m-0 leading-relaxed font-normal">
                      {item.notes}
                    </p>
                  </div>

                  {/* Right: Action Button (Google Form or Mail) */}
                  <div className="shrink-0 flex items-center gap-2">
                    {item.formUrl ? (
                      <a
                        href={item.formUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-900/30 transition-all transform hover:scale-[1.02]"
                      >
                        <span>{item.formName || 'Kayıt Formu'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : item.type === 'contact' ? (
                      <a
                        href={`mailto:${item.email}?subject=${encodeURIComponent(
                          item.code + ' Kayıt İsteği'
                        )}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Asistana Yaz</span>
                      </a>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs border border-slate-300 dark:border-slate-700 font-medium">
                        {typeCfg.shortLabel}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          <span>Kaynak: 2026-2027 Fall 4XX Course Registration Announcement (ODTÜ ME)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
