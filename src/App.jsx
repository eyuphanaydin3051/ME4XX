// src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import initialCoursesData from './data/all_courses.json';
import departmentsData from './data/departments.json';
import Header from './components/Header';
import Timetable from './components/Timetable';
import CourseSelector from './components/CourseSelector';
import BlockedHoursManager from './components/BlockedHoursManager';
import VariationExplorer from './components/VariationExplorer';
import ExportTimetableModal from './components/ExportTimetableModal';
import SavePreferencesModal from './components/SavePreferencesModal';
import DepartmentsModal from './components/DepartmentsModal';
import HelpModal from './components/HelpModal';
import RegistrationGuideModal from './components/RegistrationGuideModal';
import { loadSavedState, saveState } from './utils/storage';
import {
  FileText,
  BookmarkPlus,
  Building2,
} from 'lucide-react';

export default function App() {
  const [coursesData, setCoursesData] = useState(initialCoursesData);
  const timetableRef = useRef(null);

  // Load persisted state or use defaults
  const savedState = useMemo(() => loadSavedState(), []);

  // Department & Surname Profile
  const [studentDepartment, setStudentDepartment] = useState(() => {
    return savedState?.studentDepartment || 'ME';
  });

  const [studentSurname, setStudentSurname] = useState(() => {
    return savedState?.studentSurname || '';
  });

  const [checkSurname, setCheckSurname] = useState(() => {
    return savedState?.checkSurname !== undefined ? savedState.checkSurname : true;
  });

  const [checkDepartment, setCheckDepartment] = useState(() => {
    return savedState?.checkDepartment !== undefined ? savedState.checkDepartment : true;
  });

  const [isDepartmentsModalOpen, setIsDepartmentsModalOpen] = useState(false);

  // Selected Courses
  const [selectedCourses, setSelectedCourses] = useState(() => {
    if (savedState?.selectedCourses && savedState.selectedCourses.length > 0) {
      return savedState.selectedCourses
        .map((saved) => {
          const matchCourse = initialCoursesData.courses.find(
            (c) => c.code === saved.courseCode || c.codeStr === saved.codeStr
          );
          if (!matchCourse) return null;
          const matchSection = saved.sectionNumber
            ? matchCourse.sections.find((s) => s.sectionNumber === saved.sectionNumber)
            : matchCourse.sections.find((s) => s.hasSchedule) || matchCourse.sections[0] || null;
          return { course: matchCourse, section: matchSection };
        })
        .filter(Boolean);
    }
    // Default initial demo course: ME 305 Section 1 (or department's first course)
    const defaultCourse =
      initialCoursesData.courses.find(
        (c) =>
          c.department === 'ME' && (c.courseNumber === '305' || c.codeStr === 'ME 305')
      ) || initialCoursesData.courses[0];

    if (defaultCourse && defaultCourse.sections.length > 0) {
      const scheduledSec =
        defaultCourse.sections.find((s) => s.hasSchedule) || defaultCourse.sections[0];
      return [{ course: defaultCourse, section: scheduledSec }];
    }
    return [];
  });

  const [blockedSlots, setBlockedSlots] = useState(() => {
    return new Set(savedState?.blockedSlots || []);
  });

  const [targetTotalCount, setTargetTotalCount] = useState(() => {
    return savedState?.targetTotalCount || 5;
  });

  // Candidate electives pool
  const [enabledElectiveCodes, setEnabledElectiveCodes] = useState(() => {
    if (savedState?.enabledElectiveCodes && Array.isArray(savedState.enabledElectiveCodes)) {
      return new Set(savedState.enabledElectiveCodes);
    }
    if (savedState?.enabledMe4Codes && Array.isArray(savedState.enabledMe4Codes)) {
      return new Set(savedState.enabledMe4Codes);
    }
    // Initial electives pool for studentDepartment
    const deptUpper = (savedState?.studentDepartment || 'ME').toUpperCase();
    return new Set(
      initialCoursesData.courses
        .filter(
          (c) =>
            (c.department || '').toUpperCase() === deptUpper &&
            !c.isMust &&
            c.sections.some((s) => s.hasSchedule) &&
            (c.courseNumber?.startsWith('4') || c.category?.includes('Seçmeli')) &&
            !['407', '410', '400', '490', '491', '492'].includes(c.courseNumber)
        )
        .map((c) => c.code)
    );
  });

  const [sortCriterion, setSortCriterion] = useState(() => {
    return savedState?.sortCriterion || 'free_days';
  });

  const [activeVariation, setActiveVariation] = useState(null);
  const [previewItems, setPreviewItems] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isRegGuideOpen, setIsRegGuideOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Persist state changes
  useEffect(() => {
    saveState({
      studentDepartment,
      studentSurname,
      checkSurname,
      checkDepartment,
      selectedCourses: selectedCourses.map((s) => ({
        courseCode: s.course.code,
        courseNumber: s.course.courseNumber,
        codeStr: s.course.codeStr,
        sectionNumber: s.section ? s.section.sectionNumber : null,
      })),
      blockedSlots: Array.from(blockedSlots),
      targetTotalCount,
      enabledElectiveCodes: Array.from(enabledElectiveCodes),
      sortCriterion,
    });
  }, [
    studentDepartment,
    studentSurname,
    checkSurname,
    checkDepartment,
    selectedCourses,
    blockedSlots,
    targetTotalCount,
    enabledElectiveCodes,
    sortCriterion,
  ]);

  // Timetable display items
  const displayScheduledItems = useMemo(() => {
    if (activeVariation && activeVariation.items) {
      return activeVariation.items.map((item) => ({
        ...item,
        isElective: activeVariation.addedElectives.some(
          (e) => e.course.code === item.course.code
        ),
      }));
    }
    return selectedCourses
      .filter((s) => s.section)
      .map((s) => ({ ...s, isElective: s.course.courseNumber?.startsWith('4') }));
  }, [activeVariation, selectedCourses]);

  // Handlers for Selected Courses
  const handleAddCourse = (course, section) => {
    setSelectedCourses((prev) => {
      const existingIdx = prev.findIndex((p) => p.course.code === course.code);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { course, section };
        return next;
      }
      return [...prev, { course, section }];
    });
  };

  const handleRemoveCourse = (courseCode) => {
    setSelectedCourses((prev) => prev.filter((p) => p.course.code !== courseCode));
  };

  const handleChangeCourseSection = (courseCode, section) => {
    setSelectedCourses((prev) =>
      prev.map((p) => (p.course.code === courseCode ? { ...p, section } : p))
    );
  };

  // Handlers for Blocked Slots
  const handleToggleBlockSlot = (slotKey) => {
    setBlockedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slotKey)) {
        next.delete(slotKey);
      } else {
        next.add(slotKey);
      }
      return next;
    });
  };

  const handleUpdateBlockedSlots = (newSet) => {
    setBlockedSlots(newSet);
  };

  // Pin a generated variation as the permanent selected courses
  const handlePinVariation = (variation) => {
    if (!variation || !variation.items) return;
    setSelectedCourses(
      variation.items.map((item) => ({
        course: item.course,
        section: item.section,
      }))
    );
  };

  // Load a saved plan into application state
  const handleLoadPlan = (plan) => {
    if (!plan) return;

    if (plan.studentDepartment) {
      setStudentDepartment(plan.studentDepartment);
    }
    if (plan.studentSurname !== undefined) {
      setStudentSurname(plan.studentSurname);
    }

    // 1. Restore fixed courses
    const coursesToRestore = plan.fixedCourses || plan.selectedCourses || [];
    if (coursesToRestore && coursesToRestore.length > 0) {
      const hydrated = coursesToRestore
        .map((item) => {
          const matchCourse = coursesData.courses.find(
            (c) =>
              c.code === item.courseCode ||
              c.courseNumber === item.courseNumber ||
              c.codeStr === item.codeStr
          );
          if (!matchCourse) return null;
          const matchSection = item.sectionNumber
            ? matchCourse.sections.find((s) => s.sectionNumber === item.sectionNumber)
            : matchCourse.sections.find((s) => s.hasSchedule) || matchCourse.sections[0];
          return { course: matchCourse, section: matchSection };
        })
        .filter(Boolean);
      setSelectedCourses(hydrated);
    } else {
      setSelectedCourses([]);
    }

    // 2. Restore electives pool
    const pool = plan.enabledElectiveCodes || plan.enabledMe4Codes;
    if (pool && Array.isArray(pool)) {
      setEnabledElectiveCodes(new Set(pool));
    }

    // 3. Restore blocked slots
    if (plan.blockedSlots) {
      setBlockedSlots(new Set(plan.blockedSlots));
    }

    // 4. Restore target total count
    if (plan.targetTotalCount) {
      setTargetTotalCount(plan.targetTotalCount);
    }

    // 5. Restore sort criterion
    if (plan.sortCriterion) {
      setSortCriterion(plan.sortCriterion);
    }

    setActiveVariation(null);
  };

  // Reset all selections
  const handleResetAll = () => {
    if (window.confirm('Tüm ders seçimlerini ve bloklu saatleri sıfırlamak istediğinize emin misiniz?')) {
      setSelectedCourses([]);
      setBlockedSlots(new Set());
      setTargetTotalCount(5);
      setActiveVariation(null);
    }
  };

  // Sync latest data from SIS for current department
  const handleSyncData = async () => {
    try {
      setIsSyncing(true);
      setSyncMessage('ODTÜ SIS taranıyor...');
      // Fetch public json or trigger refresh
      const res = await fetch('/data/all_courses.json');
      if (res.ok) {
        const fresh = await res.json();
        setCoursesData(fresh);
        setSyncMessage(`Senkronize edildi! (${fresh.metadata.totalCourses} ders güncel)`);
      } else {
        setSyncMessage('Veritabanı güncel (5,302 ders)');
      }
      setTimeout(() => setSyncMessage(''), 4000);
    } catch (err) {
      console.warn('Veri senkronizasyonu hatası:', err);
      setSyncMessage('Yerel veritabanı aktif (5,302 ders)');
      setTimeout(() => setSyncMessage(''), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white transition-colors">
      {/* Global Header */}
      <Header
        metadata={coursesData.metadata}
        studentDepartment={studentDepartment}
        studentSurname={studentSurname}
        onOpenDepartmentsModal={() => setIsDepartmentsModalOpen(true)}
        onResetAll={handleResetAll}
        onSyncData={handleSyncData}
        isSyncing={isSyncing}
        syncMessage={syncMessage}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenRegistrationGuide={() => setIsRegGuideOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Control Bar with Quick Info & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/60 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>

            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Aktif Bölüm:{' '}
              <strong className="text-indigo-600 dark:text-indigo-400">
                {studentDepartment}
              </strong>{' '}
              &bull;{' '}
              <strong className="text-slate-900 dark:text-white">
                {displayScheduledItems.length} Ders Kayıtlı
              </strong>{' '}
              ({blockedSlots.size} saat bloklu)
            </span>

            {studentSurname && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Soyad Kriteri: {studentSurname.slice(0, 2).toUpperCase()} ({checkSurname ? 'Aktif' : 'Pasif'})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDepartmentsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all"
              title="Okuldaki tüm bölümleri listele ve seç"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Bölüm Değiştir ({studentDepartment})</span>
            </button>

            {studentDepartment === 'ME' && (
              <button
                onClick={() => setIsRegGuideOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-600/20 dark:hover:bg-purple-600/30 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-500/40 text-xs font-semibold shadow-xs transition-all"
              >
                <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span className="hidden sm:inline">4xx Kayıt Bilgisi (Resmi PDF)</span>
                <span className="sm:hidden">4xx PDF</span>
              </button>
            )}

            <button
              onClick={() => setIsSaveModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/20 transition-all transform hover:scale-[1.02]"
              title="Seçimleri Kaydet, Kayıtlı Tercihleri Yükle, SIS Kodları veya JSON Dosyasını Yönet"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Seçimleri Kaydet</span>
            </button>
          </div>
        </div>

        {/* 1) Top: Universal Course Search & Course Catalog */}
        <div className="w-full">
          <CourseSelector
            allCourses={coursesData.courses}
            departments={departmentsData}
            studentDepartment={studentDepartment}
            onChangeDepartment={setStudentDepartment}
            onOpenDepartmentsModal={() => setIsDepartmentsModalOpen(true)}
            studentSurname={studentSurname}
            onChangeSurname={setStudentSurname}
            checkSurname={checkSurname}
            onToggleCheckSurname={() => setCheckSurname(!checkSurname)}
            checkDepartment={checkDepartment}
            onToggleCheckDepartment={() => setCheckDepartment(!checkDepartment)}
            selectedCourses={selectedCourses}
            onAddCourse={handleAddCourse}
            onRemoveCourse={handleRemoveCourse}
            onChangeCourseSection={handleChangeCourseSection}
            blockedSlots={blockedSlots}
            onPreviewHover={setPreviewItems}
          />
        </div>

        {/* 2) Variation Explorer & Elective Optimizer */}
        <div className="w-full">
          <VariationExplorer
            allCourses={coursesData.courses}
            studentDepartment={studentDepartment}
            studentSurname={studentSurname}
            checkSurname={checkSurname}
            checkDepartment={checkDepartment}
            selectedCourses={selectedCourses}
            blockedSlots={blockedSlots}
            targetTotalCount={targetTotalCount}
            onChangeTargetTotal={setTargetTotalCount}
            activeVariation={activeVariation}
            onSelectVariation={setActiveVariation}
            onPinVariation={handlePinVariation}
            onPreviewHover={setPreviewItems}
            enabledElectiveCodes={enabledElectiveCodes}
            onChangeEnabledElectiveCodes={setEnabledElectiveCodes}
            sortCriterion={sortCriterion}
            onChangeSortCriterion={setSortCriterion}
          />
        </div>

        {/* 3) Blocked Hours Manager */}
        <div className="w-full">
          <BlockedHoursManager
            blockedSlots={blockedSlots}
            onUpdateBlockedSlots={handleUpdateBlockedSlots}
          />
        </div>

        {/* 4) Weekly Timetable */}
        <div className="w-full">
          <Timetable
            scheduledItems={displayScheduledItems}
            blockedSlots={blockedSlots}
            onToggleBlockSlot={handleToggleBlockSlot}
            previewItems={previewItems}
            timetableRef={timetableRef}
            onOpenExport={() => setIsExportModalOpen(true)}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-6 text-center text-xs text-slate-500 dark:text-slate-400 no-print transition-colors">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="m-0 font-medium">
            ODTÜ Tüm Bölümler Ders Programı & Planlayıcı • Robotdeğilim & SIS Altyapısı
          </p>
          <p className="m-0 text-slate-400 dark:text-slate-500 text-[11px]">
            156 Bölüm • 5,300+ Ders &bull; Soyad & Bölüm Kriter Kontrolü &bull; Otomatik Varyasyon Optimizasyonu
          </p>
        </div>
      </footer>

      {/* Modals */}
      <DepartmentsModal
        isOpen={isDepartmentsModalOpen}
        onClose={() => setIsDepartmentsModalOpen(false)}
        departments={departmentsData}
        currentDepartment={studentDepartment}
        onSelectDepartment={setStudentDepartment}
      />

      <SavePreferencesModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        studentDepartment={studentDepartment}
        studentSurname={studentSurname}
        selectedCourses={selectedCourses}
        enabledElectiveCodes={enabledElectiveCodes}
        blockedSlots={blockedSlots}
        targetTotalCount={targetTotalCount}
        sortCriterion={sortCriterion}
        onLoadPlan={handleLoadPlan}
        metadata={coursesData.metadata}
        allCourses={coursesData.courses}
      />

      <ExportTimetableModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        timetableRef={timetableRef}
        scheduledCourses={displayScheduledItems}
        metadata={coursesData.metadata}
        studentDepartment={studentDepartment}
        studentSurname={studentSurname}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <RegistrationGuideModal
        isOpen={isRegGuideOpen}
        onClose={() => setIsRegGuideOpen(false)}
      />
    </div>
  );
}
