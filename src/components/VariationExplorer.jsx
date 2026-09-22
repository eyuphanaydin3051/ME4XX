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
} from 'lucide-react';
import { generateVariations } from '../utils/solver';
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
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 flex flex-col gap-4">
      {/* Top Header & Target Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md shadow-amber-900/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider m-0">
              ME4 Seçmeli Varyasyon Üreteci
            </h2>
            <p className="text-xs text-slate-400 m-0">
              Hedef toplam ders sayısına göre çakışmasız ME4 teknik seçmelilerini optimize eder.
            </p>
          </div>
        </div>

        {/* Target Total Stepper */}
        <div className="flex items-center gap-3 bg-slate-950/70 p-2 rounded-xl border border-slate-800">
          <span className="text-xs font-medium text-slate-300">
            Hedef Toplam Ders:
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChangeTargetTotal(Math.max(1, targetTotalCount - 1))}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-sm transition-colors"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-bold text-indigo-400">
              {targetTotalCount}
            </span>
            <button
              onClick={() => onChangeTargetTotal(Math.min(10, targetTotalCount + 1))}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-sm transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
            {selectedCourses.length} Sabit Ders
          </span>
          <span>+</span>
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
            {electivesNeeded} ME4 Seçmeli
          </span>
          <span>=</span>
          <span className="font-bold text-slate-200">{targetTotalCount} Toplam Ders</span>
        </div>

        {/* Filter Drawer Toggle */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span>ME4 Havuzu ({enabledMe4Codes.size}/{allMe4Courses.length})</span>
          {isFilterOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Expandable ME4 Filter Checklist */}
      {isFilterOpen && (
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Varyasyonlarda Denenecek ME4 Derslerini Seçin:
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                onClick={selectAllMe4}
                className="text-indigo-400 hover:underline"
              >
                Tümünü Seç
              </button>
              <span>•</span>
              <button
                onClick={clearAllMe4}
                className="text-slate-400 hover:underline"
              >
                Tümünü Kaldır
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
            {allMe4Courses.map((c) => {
              const isChecked = enabledMe4Codes.has(c.code);
              return (
                <label
                  key={c.code}
                  className={`flex items-start gap-2 p-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'bg-indigo-600/10 border-indigo-500/40 text-slate-200'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleMe4Course(c.code)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-0"
                  />
                  <div className="min-w-0">
                    <span className="font-bold">{c.codeStr}</span>
                    <p className="text-[10px] text-slate-400 truncate">{c.name}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Sort Criteria Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-300">
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
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-300'
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
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{solverResult.error}</span>
        </div>
      ) : variations.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-slate-400 text-xs space-y-1">
          <AlertCircle className="w-6 h-6 mx-auto text-amber-400 mb-2" />
          <div className="font-semibold text-slate-200">
            Uygun Varyasyon Bulunamadı
          </div>
          <p className="text-slate-400 max-w-md mx-auto">
            Blokladığınız saatler veya sabit seçtiğiniz dersler ME4 seçmelileriyle çakışıyor olabilir.
            Blok saatlerini azaltmayı veya farklı sectionlar seçmeyi deneyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Top Navigator Bar */}
          <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-400">
                Varyasyon {currentIndex + 1} / {variations.length}
              </span>
              <span className="text-xs text-slate-400">
                ({variations.length} geçerli program bulundu)
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Önceki Varyasyon"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === variations.length - 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Sonraki Varyasyon"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Current Variation Highlight Card */}
          {currentVar && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 shadow-lg space-y-3">
              {/* Variation Metrics Badges */}
              <div className="flex flex-wrap gap-2 text-xs">
                {currentVar.metrics.freeDaysCount > 0 ? (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                    <Coffee className="w-3.5 h-3.5" />
                    {currentVar.metrics.freeDaysCount} Boş Gün ({currentVar.metrics.freeDays.join(', ')})
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    Boş gün yok
                  </span>
                )}

                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {currentVar.metrics.totalGapHours} Saat Boşluk/Bekleme
                </span>

                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium">
                  <Sun className="w-3.5 h-3.5" />
                  {currentVar.metrics.earlyStartsCount === 0
                    ? '08:40 Dersi Yok! ☀️'
                    : `${currentVar.metrics.earlyStartsCount} Gün 08:40 Başlangıcı`}
                </span>
              </div>

              {/* Added ME4 Electives in this variation */}
              {currentVar.addedElectives.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider mb-1.5">
                    Bu Varyasyona Eklenen ME4 Teknik Seçmeliler:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentVar.addedElectives.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-950/60 border border-amber-500/30 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-amber-300">
                              {item.course.codeStr}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                              Sec {item.section.sectionNumber}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {item.course.name}
                          </div>
                        </div>

                        {item.section.instructors?.[0] && (
                          <div className="text-[10px] text-slate-400 text-right shrink-0">
                            {item.section.instructors[0].name.split(' ').slice(-1)[0]}
                          </div>
                        )}
                      </div>
                    ))}
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
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-amber-600 hover:from-indigo-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all transform hover:scale-[1.02]"
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
                      ? 'bg-indigo-600/30 border-indigo-400 ring-1 ring-indigo-400'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className={isCurrent ? 'text-indigo-300' : 'text-slate-300'}>
                      Varyasyon #{idx + 1}
                    </span>
                    {v.metrics.freeDaysCount > 0 && (
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {v.metrics.freeDaysCount} Gün Boş
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-1">
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
