// src/components/VariationExplorer.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Calendar,
  Clock,
  Coffee,
  Sun,
  AlertCircle,
  Award,
  Pin,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  FileText,
  Keyboard,
} from 'lucide-react';
import { generateVariations } from '../utils/solver';
import { getRegistrationInfo, REG_TYPE_CONFIG } from '../utils/registration';
import confetti from 'canvas-confetti';

const SORT_OPTIONS = [
  { id: 'free_days', label: 'En Çok Boş Gün (Tatil Odaklı)', icon: Coffee },
  { id: 'compact', label: 'En Az Boşluklu (Kompakt)', icon: Clock },
  { id: 'late_start', label: 'En Geç Başlayanlar (8:40 Yok)', icon: Sun },
  { id: 'balanced', label: 'Dengeli Dağılım', icon: Award },
];

export default function VariationExplorer({
  allCourses = [],
  selectedCourses = [], // [{ course, section }]
  blockedSlots = new Set(),
  targetTotalCount = 5,
  onChangeTargetTotal,
  activeVariation = null,
  onSelectVariation,
  onPinVariation,
  onPreviewHover,
}) {
  const [sortCriterion, setSortCriterion] = useState('free_days');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // All ME4 courses in the database that have at least one scheduled section
  const allMe4Courses = useMemo(() => {
    return allCourses
      .filter((c) => c.isME4 && c.sections.some((s) => s.hasSchedule))
      .sort((a, b) => parseInt(a.courseNumber, 10) - parseInt(b.courseNumber, 10));
  }, [allCourses]);

  // Set of enabled ME4 course codes (default: all of them enabled)
  const [enabledMe4Codes, setEnabledMe4Codes] = useState(() => {
    return new Set(allMe4Courses.map((c) => c.code));
  });

  // Keep enabledMe4Codes in sync if allMe4Courses changes
  useEffect(() => {
    if (allMe4Courses.length > 0 && enabledMe4Codes.size === 0) {
      setEnabledMe4Codes(new Set(allMe4Courses.map((c) => c.code)));
    }
  }, [allMe4Courses]);

  const toggleMe4Course = (code) => {
    const next = new Set(enabledMe4Codes);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setEnabledMe4Codes(next);
  };

  const selectAllMe4 = () => {
    setEnabledMe4Codes(new Set(allMe4Courses.map((c) => c.code)));
  };

  const clearAllMe4 = () => {
    setEnabledMe4Codes(new Set());
  };

  // Run solver
  const solverResult = useMemo(() => {
    return generateVariations({
      fixedSelections: selectedCourses,
      targetTotalCount,
      blockedSlotsSet: blockedSlots,
      me4Pool: allMe4Courses,
      enabledMe4Codes,
      sortCriterion,
      maxResults: 200,
    });
  }, [
    selectedCourses,
    targetTotalCount,
    blockedSlots,
    allMe4Courses,
    enabledMe4Codes,
    sortCriterion,
  ]);

  const variations = solverResult.variations || [];
  const electivesNeeded = solverResult.electivesNeeded || 0;

  // Keep index within bounds and sync active variation
  useEffect(() => {
    if (variations.length > 0) {
      const safeIndex = Math.min(currentIndex, variations.length - 1);
      setCurrentIndex(safeIndex);
      onSelectVariation(variations[safeIndex]);
    } else {
      setCurrentIndex(0);
      onSelectVariation(null);
    }
  }, [variations, currentIndex]);

  const currentVar = variations[currentIndex] || null;

  // Trigger celebratory confetti when variations are generated
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e) {}
  };

  const handleNext = () => {
    if (currentIndex < variations.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Keyboard navigation (ArrowLeft and ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when user is typing in form inputs
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }

      if (e.key === 'ArrowRight') {
        if (variations.length > 0) {
          e.preventDefault();
          setCurrentIndex((prev) => Math.min(variations.length - 1, prev + 1));
        }
      } else if (e.key === 'ArrowLeft') {
        if (variations.length > 0) {
          e.preventDefault();
          setCurrentIndex((prev) => Math.max(0, prev - 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [variations.length]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-5 flex flex-col gap-4 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Header & Target Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md shadow-amber-900/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider m-0">
              ME4 Seçmeli Varyasyon Üreteci
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
              Hedef toplam ders sayısına göre çakışmasız ME4 teknik seçmelilerini optimize eder.
            </p>
          </div>
        </div>

        {/* Target Total Stepper */}
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-950/70 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Hedef Toplam Ders:
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChangeTargetTotal(Math.max(1, targetTotalCount - 1))}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-sm border border-slate-300 dark:border-slate-700 transition-colors"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {targetTotalCount}
            </span>
            <button
              onClick={() => onChangeTargetTotal(Math.min(10, targetTotalCount + 1))}
              className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-sm border border-slate-300 dark:border-slate-700 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/30">
            {selectedCourses.length} Sabit Ders
          </span>
          <span>+</span>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30">
            {electivesNeeded} ME4 Seçmeli
          </span>
          <span>=</span>
          <span className="font-bold text-slate-900 dark:text-slate-200">{targetTotalCount} Toplam Ders</span>
        </div>

        {/* Filter Drawer Toggle */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 transition-all font-medium"
        >
          <Filter className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>🎯 ME4 Aday Havuzunu Özelleştir ({enabledMe4Codes.size}/{allMe4Courses.length} Ders Seçili)</span>
          {isFilterOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Expandable ME4 Filter Checklist - 2 Columns Horizontal Layout with Rich Details */}
      {isFilterOpen && (
        <div className="p-4 bg-slate-50 dark:bg-slate-950/90 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>📋 ME4 Teknik Seçmeli Aday Ders Havuzu</span>
                <span className="text-[11px] font-normal text-indigo-600 dark:text-indigo-400">
                  ({enabledMe4Codes.size} / {allMe4Courses.length} ders aktif)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                Varyasyon motorunun aralarından programınıza eklemesini istediğiniz ME4 seçmelilerini belirleyin. İstemediğiniz derslerin işaretini kaldırarak eleyebilirsiniz.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs shrink-0">
              <button
                onClick={selectAllMe4}
                className="px-2.5 py-1 rounded-md bg-indigo-600/10 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600/20 dark:hover:bg-indigo-600/50 border border-indigo-500/30 transition-colors font-medium"
              >
                Tümünü Seç
              </button>
              <button
                onClick={clearAllMe4}
                className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
              >
                Tümünü Kaldır
              </button>
            </div>
          </div>

          {/* 2 Columns Layout for Detailed View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {allMe4Courses.map((c) => {
              const isChecked = enabledMe4Codes.has(c.code);
              const scheduledSecs = (c.sections || []).filter((s) => s.hasSchedule);
              const regInfo = getRegistrationInfo(c.codeStr);
              const regCfg = regInfo ? REG_TYPE_CONFIG[regInfo.type] : null;

              return (
                <div
                  key={c.code}
                  onClick={() => toggleMe4Course(c.code)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer select-none transition-all flex flex-col justify-between gap-2 ${
                    isChecked
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-500/50 shadow-sm'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 text-slate-400 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent onClick
                      className="mt-1 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold text-xs ${
                              isChecked ? 'text-amber-600 dark:text-amber-300' : 'text-slate-400'
                            }`}
                          >
                            {c.codeStr}
                          </span>
                          {regCfg && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold border ${regCfg.badgeClass}`}>
                              {regCfg.shortLabel}
                            </span>
                          )}
                        </div>
                        {c.credits?.total > 0 && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/60">
                            {c.credits.total} Kredi • {c.credits.ects} AKTS
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-xs font-medium leading-tight mt-0.5 ${
                          isChecked ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'
                        }`}
                      >
                        {c.name}
                      </div>

                      {/* Registration Info Callout (from PDF) */}
                      {regInfo && (
                        <div className="mt-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 text-[11px] space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                              <FileText className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                              {regCfg?.label}
                            </span>
                            {regInfo.formUrl && (
                              <a
                                href={regInfo.formUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold shadow-sm transition-all"
                              >
                                <span>{regInfo.formName || 'Formu Aç'}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                          <p className="text-[10.5px] text-slate-600 dark:text-slate-300 leading-tight m-0">
                            {regInfo.notes}
                          </p>
                          <div className="text-[10px] text-purple-800 dark:text-purple-200/80 flex flex-wrap items-center gap-1 pt-0.5 border-t border-purple-200 dark:border-purple-800/30">
                            <span>Asistan: {regInfo.assistant}</span>
                            <span>•</span>
                            <a
                              href={`mailto:${regInfo.email}?subject=${encodeURIComponent(
                                c.codeStr + ' Kayıt Bilgisi'
                              )}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-medium"
                            >
                              <Mail className="w-2.5 h-2.5 inline" /> {regInfo.email}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section schedule and instructor info */}
                  {scheduledSecs.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5 pl-6 text-[11px]">
                      {scheduledSecs.map((sec) => (
                        <div key={sec.sectionNumber} className="space-y-0.5">
                          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-300">
                              Section {sec.sectionNumber}:
                            </span>
                            {sec.instructors?.length > 0 && (
                              <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[170px]" title={sec.instructors.map((i) => i.name).join(', ')}>
                                {sec.instructors.map((i) => i.name).join(', ')}
                              </span>
                            )}
                          </div>
                          {sec.schedule?.length > 0 && (
                            <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                              {sec.schedule.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
                                >
                                  {s.dayTr} {s.startHour}-{s.endHour} ({s.classroom || 'ME'})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sort Criteria Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Varyasyon Sıralaması:
        </span>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {SORT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = sortCriterion === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSortCriterion(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Cards & Navigator */}
      {!solverResult.success ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
          <span>{solverResult.error}</span>
        </div>
      ) : variations.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-xs space-y-1">
          <AlertCircle className="w-6 h-6 mx-auto text-amber-500 dark:text-amber-400 mb-2" />
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            Uygun Varyasyon Bulunamadı
          </div>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Blokladığınız saatler veya sabit seçtiğiniz dersler ME4 seçmelileriyle çakışıyor olabilir.
            Blok saatlerini azaltmayı veya farklı sectionlar seçmeyi deneyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Top Navigator Bar with Keyboard Shortcut Hint */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                Varyasyon {currentIndex + 1} / {variations.length}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({variations.length} geçerli program)
              </span>

              {/* Keyboard Shortcut Indicator */}
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/90 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono shadow-xs">
                <Keyboard className="w-3 h-3 text-indigo-500 inline mr-0.5" />
                <span>Geçiş:</span>
                <kbd className="px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-[10px] text-indigo-600 dark:text-indigo-400">←</kbd>
                <kbd className="px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-bold text-[10px] text-indigo-600 dark:text-indigo-400">→</kbd>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Önceki Varyasyon (Sol Ok ←)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === variations.length - 1}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Sonraki Varyasyon (Sağ Ok →)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Current Variation Highlight Card */}
          {currentVar && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/50 via-white to-amber-50/40 dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900 border border-indigo-200 dark:border-indigo-500/30 shadow-lg space-y-3">
              {/* Variation Metrics Badges */}
              <div className="flex flex-wrap gap-2 text-xs">
                {currentVar.metrics.freeDaysCount > 0 ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold">
                    <Coffee className="w-3.5 h-3.5" />
                    {currentVar.metrics.freeDaysCount} Boş Gün ({currentVar.metrics.freeDays.join(', ')})
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Boş gün yok
                  </span>
                )}

                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {currentVar.metrics.totalGapHours} Saat Boşluk/Bekleme
                </span>

                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-medium">
                  <Sun className="w-3.5 h-3.5" />
                  {currentVar.metrics.earlyStartsCount === 0
                    ? '08:40 Dersi Yok! ☀️'
                    : `${currentVar.metrics.earlyStartsCount} Gün 08:40 Başlangıcı`}
                </span>
              </div>

              {/* Added ME4 Electives in this variation */}
              {currentVar.addedElectives.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1.5">
                    Bu Varyasyona Eklenen ME4 Teknik Seçmeliler:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentVar.addedElectives.map((item, idx) => {
                      const reg = getRegistrationInfo(item.course.codeStr);
                      const regCfg = reg ? REG_TYPE_CONFIG[reg.type] : null;

                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-white dark:bg-slate-950/60 border border-amber-200 dark:border-amber-500/30 shadow-xs flex items-center justify-between text-xs gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-amber-700 dark:text-amber-300">
                                {item.course.codeStr}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30">
                                Sec {item.section.sectionNumber}
                              </span>
                              {regCfg && (
                                <span className={`text-[9.5px] px-1.5 py-0.2 rounded-full border font-semibold ${regCfg.badgeClass}`}>
                                  {regCfg.shortLabel}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                              {item.course.name}
                            </div>
                            {reg && (
                              <div className="text-[10px] text-purple-700 dark:text-purple-300/90 truncate mt-0.5" title={reg.notes}>
                                {reg.notes}
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 flex flex-col items-end gap-1">
                            {item.section.instructors?.length > 0 && (
                              <div
                                className="text-[10px] text-slate-700 dark:text-slate-300 font-medium text-right max-w-[150px] truncate"
                                title={item.section.instructors.map((i) => i.name).join(', ')}
                              >
                                {item.section.instructors.map((i) => i.name).join(', ')}
                              </div>
                            )}
                            {reg?.formUrl && (
                              <a
                                href={reg.formUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold shadow-sm transition-all"
                              >
                                <span>Kayıt Formu</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pin / Apply Variation Button */}
              <div className="flex items-center justify-end pt-1">
                <button
                  onClick={() => {
                    onPinVariation(currentVar);
                    triggerConfetti();
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/20 transition-all transform hover:scale-[1.02]"
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span>Bu Varyasyonu Sabit Seçim Olarak Kaydet</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Mini Slider of First 5-8 Variations */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {variations.slice(0, 8).map((v, idx) => {
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={v.id}
                  onClick={() => setCurrentIndex(idx)}
                  onMouseEnter={() => onPreviewHover(v.addedElectives)}
                  onMouseLeave={() => onPreviewHover(null)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'bg-indigo-50 dark:bg-indigo-600/30 border-indigo-500 dark:border-indigo-400 ring-1 ring-indigo-500 dark:ring-indigo-400'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className={isCurrent ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}>
                      Varyasyon #{idx + 1}
                    </span>
                    {v.metrics.freeDaysCount > 0 && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {v.metrics.freeDaysCount} Gün Boş
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1">
                    {v.addedElectives.map((e) => e.course.codeStr).join(', ')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
