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
  ShieldCheck,
} from 'lucide-react';
import { generateVariations } from '../utils/solver';
import { getRegistrationInfo, REG_TYPE_CONFIG } from '../utils/registration';
import { getCoursePrerequisite } from '../utils/prerequisites';
import confetti from 'canvas-confetti';

const SORT_OPTIONS = [
  { id: 'free_days', label: 'En Çok Boş Gün (Tatil Odaklı)', icon: Coffee },
  { id: 'compact', label: 'En Az Boşluklu (Kompakt)', icon: Clock },
  { id: 'late_start', label: 'En Geç Başlayanlar (8:40 Yok)', icon: Sun },
  { id: 'balanced', label: 'Dengeli Dağılım', icon: Award },
];

export default function VariationExplorer({
  allCourses = [],
  studentDepartment = 'ME',
  studentSurname = '',
  checkSurname = true,
  checkDepartment = true,
  selectedCourses = [], // [{ course, section }]
  blockedSlots = new Set(),
  targetTotalCount = 5,
  onChangeTargetTotal,
  activeVariation = null,
  onSelectVariation,
  onPinVariation,
  onPreviewHover,
  enabledElectiveCodes: externalEnabledCodes,
  onChangeEnabledElectiveCodes,
  sortCriterion: externalSortCriterion,
  onChangeSortCriterion,
}) {
  const [internalSortCriterion, setInternalSortCriterion] = useState('free_days');
  const sortCriterion = externalSortCriterion !== undefined ? externalSortCriterion : internalSortCriterion;
  const setSortCriterion = onChangeSortCriterion || setInternalSortCriterion;

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Department elective courses pool that have at least one scheduled section
  const allDepartmentElectives = useMemo(() => {
    const deptUpper = (studentDepartment || 'ME').toUpperCase();
    const deptCourses = allCourses.filter(
      (c) => (c.department || '').toUpperCase() === deptUpper
    );

    // Look for 4xx or elective courses
    let electives = deptCourses.filter(
      (c) =>
        (c.category?.includes('Seçmeli') ||
          c.category?.includes('4. Sınıf') ||
          c.courseNumber?.startsWith('4')) &&
        !c.isMust &&
        c.sections &&
        c.sections.some((s) => s.hasSchedule) &&
        !['400', '407', '410', '490', '491', '492'].includes(c.courseNumber)
    );

    // Fallback if department has few 4xx electives: include all scheduled non-must courses of this dept
    if (electives.length < 3) {
      electives = deptCourses.filter(
        (c) =>
          !c.isMust &&
          c.sections &&
          c.sections.some((s) => s.hasSchedule)
      );
    }

    return electives.sort(
      (a, b) => (parseInt(a.courseNumber, 10) || 0) - (parseInt(b.courseNumber, 10) || 0)
    );
  }, [allCourses, studentDepartment]);

  const [internalEnabledCodes, setInternalEnabledCodes] = useState(() => {
    return new Set(allDepartmentElectives.map((c) => c.code));
  });

  const enabledElectiveCodes =
    externalEnabledCodes !== undefined ? externalEnabledCodes : internalEnabledCodes;
  const setEnabledElectiveCodes =
    onChangeEnabledElectiveCodes || setInternalEnabledCodes;

  // Sync enabled codes when pool changes
  useEffect(() => {
    if (allDepartmentElectives.length > 0) {
      const validCodeSet = new Set(allDepartmentElectives.map((c) => c.code));
      const hasInvalid = Array.from(enabledElectiveCodes).some((code) => !validCodeSet.has(code));
      if (hasInvalid || enabledElectiveCodes.size === 0) {
        const cleaned = new Set(
          [...enabledElectiveCodes].filter((code) => validCodeSet.has(code))
        );
        setEnabledElectiveCodes(cleaned.size > 0 ? cleaned : validCodeSet);
      }
    }
  }, [allDepartmentElectives]);

  const toggleElectiveCourse = (code) => {
    const next = new Set(enabledElectiveCodes);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setEnabledElectiveCodes(next);
  };

  const selectAllElectives = () => {
    setEnabledElectiveCodes(new Set(allDepartmentElectives.map((c) => c.code)));
  };

  const clearAllElectives = () => {
    setEnabledElectiveCodes(new Set());
  };

  // Run solver
  const solverResult = useMemo(() => {
    return generateVariations({
      fixedSelections: selectedCourses,
      targetTotalCount,
      blockedSlotsSet: blockedSlots,
      electivePool: allDepartmentElectives,
      enabledElectiveCodes,
      studentDept: studentDepartment,
      studentSurname,
      checkSurname,
      checkDept: checkDepartment,
      sortCriterion,
      maxResults: 200,
    });
  }, [
    selectedCourses,
    targetTotalCount,
    blockedSlots,
    allDepartmentElectives,
    enabledElectiveCodes,
    studentDepartment,
    studentSurname,
    checkSurname,
    checkDepartment,
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

  const currentVariation = variations[currentIndex] || null;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.min(variations.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [variations.length]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-5 flex flex-col gap-4 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Header & Target Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md shadow-amber-900/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider m-0">
              {studentDepartment} Seçmeli Varyasyon & Optimizasyon Motoru
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
              Hedef toplam ders sayısına göre çakışmasız {studentDepartment} seçmelilerini ve kriterlerinize uygun şubeleri optimize eder.
            </p>
          </div>
        </div>

        {/* Target Total Stepper */}
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-950/70 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
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
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/30">
            {selectedCourses.length} Sabit Ders
          </span>
          <span>+</span>
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30">
            {electivesNeeded} {studentDepartment} Seçmeli
          </span>
          <span>=</span>
          <span className="font-bold text-slate-900 dark:text-slate-200">
            {targetTotalCount} Toplam Ders
          </span>
        </div>

        {/* Filter Drawer Toggle */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 transition-all font-medium"
        >
          <Filter className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>
            🎯 {studentDepartment} Seçmeli Havuzu ({enabledElectiveCodes.size}/
            {allDepartmentElectives.length} Ders Seçili)
          </span>
          {isFilterOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Filter Checklist */}
      {isFilterOpen && (
        <div className="p-4 bg-slate-50 dark:bg-slate-950/90 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>📋 {studentDepartment} Seçmeli Aday Havuzu</span>
                <span className="text-[11px] font-normal text-indigo-600 dark:text-indigo-400">
                  ({enabledElectiveCodes.size} / {allDepartmentElectives.length} ders aktif)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                Optimizasyon motorunun programınızı tamamlarken aralarından seçeceği {studentDepartment} derslerini belirleyin.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs shrink-0">
              <button
                onClick={selectAllElectives}
                className="px-2.5 py-1 rounded-lg bg-indigo-600/10 dark:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600/20 border border-indigo-500/30 transition-colors font-medium"
              >
                Tümünü Seç
              </button>
              <button
                onClick={clearAllElectives}
                className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors"
              >
                Tümünü Kaldır
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
            {allDepartmentElectives.map((c) => {
              const isChecked = enabledElectiveCodes.has(c.code);
              return (
                <label
                  key={c.code}
                  className={`flex items-start gap-2.5 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-600/60 shadow-2xs'
                      : 'bg-slate-100/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 text-slate-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleElectiveCourse(c.code)}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className={isChecked ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}>
                        {c.codeStr}
                      </span>
                      <span className="text-[10px] font-normal text-slate-400">
                        ({c.sections?.length || 0} Sec)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                      {c.name}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Sorting Criteria Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Sıralama:</span>
          </span>
          {SORT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = sortCriterion === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSortCriterion(opt.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-500">
          Toplam <strong>{variations.length}</strong> alternatif varyasyon bulundu
        </div>
      </div>

      {/* Current Variation Card & Controls */}
      {variations.length > 0 && currentVariation ? (
        <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/30 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Index Controller */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                disabled={currentIndex === 0}
                className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-sm text-indigo-700 dark:text-indigo-300 font-mono">
                {currentIndex + 1} / {variations.length}
              </span>
              <button
                onClick={() => setCurrentIndex((p) => Math.min(variations.length - 1, p + 1))}
                disabled={currentIndex === variations.length - 1}
                className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Quality Metrics */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                <Coffee className="w-3.5 h-3.5" />
                <span>{currentVariation.metrics.freeDaysCount} Boş Gün</span>
                {currentVariation.metrics.freeDays.length > 0 && (
                  <span className="text-[10px] opacity-80">
                    ({currentVariation.metrics.freeDays.join(', ')})
                  </span>
                )}
              </span>

              <span className="px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold border border-blue-500/30 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{currentVariation.metrics.totalGapHours}s Bekleme</span>
              </span>

              <span className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/30 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5" />
                <span>{currentVariation.metrics.earlyStartsCount} Gün 08:40</span>
              </span>
            </div>

            {/* Pin / Fix Action Button */}
            <button
              onClick={() => {
                onPinVariation(currentVariation);
                confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition-all transform hover:scale-[1.02]"
              title="Bu varyasyondaki seçmeli dersleri kalıcı seçiminiz olarak sabitleyin"
            >
              <Pin className="w-3.5 h-3.5" />
              <span>Bu Programı Sabitle</span>
            </button>
          </div>

          {/* Included Elective Badges */}
          {currentVariation.addedElectives.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40 text-xs">
              <span className="text-slate-500 font-medium">Bu plana eklenen seçmeliler:</span>
              {currentVariation.addedElectives.map((item) => (
                <span
                  key={item.course.code}
                  className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700/80 font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 shadow-2xs"
                >
                  <span>{item.course.codeStr}</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    (Sec {item.section.sectionNumber})
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-400" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Mevcut kısıt ve bloklamalara uygun çakışmasız varyasyon bulunamadı.
          </p>
          <p className="text-slate-400">
            Blokladığınız saatleri esnetebilir veya seçmeli havuzundan daha fazla derse izin verebilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
}
