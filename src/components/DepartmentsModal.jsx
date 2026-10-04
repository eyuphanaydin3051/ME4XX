// src/components/DepartmentsModal.jsx
import React, { useState, useMemo } from 'react';
import { Search, Building2, X, Check, BookOpen, GraduationCap } from 'lucide-react';

const normalise = (text) =>
  String(text || '')
    .replace(/[ıİ]/g, 'i')
    .toLocaleUpperCase('en');

export default function DepartmentsModal({
  isOpen,
  onClose,
  departments = [],
  currentDepartment = 'ME',
  onSelectDepartment,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const visibleDepartments = useMemo(() => {
    const needle = normalise(searchQuery.trim());
    if (!needle) return departments;

    const rank = (dept) => {
      const abbr = normalise(dept.abbr);
      if (abbr === needle) return 0;
      if (abbr.startsWith(needle)) return 1;
      if (abbr.includes(needle)) return 2;
      return 3;
    };

    return departments
      .filter((dept) => {
        return (
          normalise(dept.abbr).includes(needle) ||
          normalise(dept.name).includes(needle) ||
          normalise(dept.code).includes(needle)
        );
      })
      .sort((a, b) => rank(a) - rank(b));
  }, [departments, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold m-0 flex items-center gap-2">
                <span>ODTÜ Bölüm Seçimi</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {departments.length} Bölüm
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                Programını hazırlamak istediğiniz bölümü seçin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Bölüm ara (Örn: CENG, ME, Bilgisayar, Makina, Fizik, MATH)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Temizle
              </button>
            )}
          </div>
        </div>

        {/* Table / List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100 dark:divide-slate-800/60">
          {visibleDepartments.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">"{searchQuery}" aramasıyla eşleşen bölüm bulunamadı.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1">
              {visibleDepartments.map((dept) => {
                const isSelected = dept.abbr.toUpperCase() === currentDepartment.toUpperCase();

                return (
                  <button
                    key={`${dept.code}-${dept.abbr}`}
                    onClick={() => {
                      onSelectDepartment(dept.abbr);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-600 shadow-xs'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm tracking-wide text-indigo-600 dark:text-indigo-400">
                          {dept.abbr}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          Kod: {dept.code}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">
                        {dept.name}
                      </div>
                      {dept.courseCount !== undefined && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {dept.courseCount} aktif ders
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800">
                          <span className="text-xs">Seç</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>
            {visibleDepartments.length} / {departments.length} bölüm gösteriliyor
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
