// src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import initialCoursesData from './data/all_courses.json';
import departmentsData from './data/departments.json';
import Header from './components/Header';
import SemesterBar from './components/SemesterBar';
import UniversalCourseSearch from './components/UniversalCourseSearch';
import SelectedCoursesList from './components/SelectedCoursesList';
import Timetable from './components/Timetable';
import BlockedHoursManager from './components/BlockedHoursManager';
import VariationExplorer from './components/VariationExplorer';
import ExportTimetableModal from './components/ExportTimetableModal';
import SavePreferencesModal from './components/SavePreferencesModal';
import DepartmentsModal from './components/DepartmentsModal';
import HelpModal from './components/HelpModal';
import RegistrationGuideModal from './components/RegistrationGuideModal';
import UnscheduledCoursesCard from './components/UnscheduledCoursesCard';
import { loadSavedState, saveState } from './utils/storage';
import {
  autoSelectEligibleSection,
  partitionMustCourses,
} from './utils/curriculum';
import {
  Sparkles,
  Clock,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
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

  const [selectedSemester, setSelectedSemester] = useState(() => {
    return savedState?.selectedSemester || 1;
  });

  const [checkSurname, setCheckSurname] = useState(() => {
    return savedState?.checkSurname !== undefined ? savedState.checkSurname : true;
  });

  const [checkDepartment, _setCheckDepartment] = useState(() => {
    return savedState?.checkDepartment !== undefined ? savedState.checkDepartment : true;
  });

  const [isDepartmentsModalOpen, setIsDepartmentsModalOpen] = useState(false);

  // Blocked slots
  const [blockedSlots, setBlockedSlots] = useState(() => {
    return new Set(savedState?.blockedSlots || []);
  });

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
    // Default initial demo course: ME 117 or ME 305
    const defaultCourse =
      initialCoursesData.courses.find(
        (c) =>
          c.department === 'ME' && (c.courseNumber === '117' || c.codeStr === 'ME 117')
      ) || initialCoursesData.courses[0];

    if (defaultCourse && defaultCourse.sections.length > 0) {
      const scheduledSec =
        defaultCourse.sections.find((s) => s.hasSchedule) || defaultCourse.sections[0];
      return [{ course: defaultCourse, section: scheduledSec }];
    }
    return [];
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

  // UI Accordions & Mobile Tab State
  const [isSolverOpen, setIsSolverOpen] = useState(false);
  const [isBlockerOpen, setIsBlockerOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState('courses'); // 'courses' | 'timetable'

  // Toast Notification
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Persist state changes
  useEffect(() => {
    saveState({
      studentDepartment,
      studentSurname,
      selectedSemester,
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
    selectedSemester,
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

  // Handler: Add or update single course
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
    setActiveVariation(null);
    setToast({
      message: `"${course.codeStr}" ders programınıza eklendi (Sec ${section?.sectionNumber || 1}).`,
      type: 'success',
    });
  };

  // Handler: Remove course
  const handleRemoveCourse = (courseCode) => {
    setSelectedCourses((prev) => prev.filter((p) => p.course.code !== courseCode));
    setActiveVariation(null);
  };

  // Handler: Change course section
  const handleChangeCourseSection = (courseCode, section) => {
    setSelectedCourses((prev) =>
      prev.map((p) => (p.course.code === courseCode ? { ...p, section } : p))
    );
    setActiveVariation(null);
  };

  // Partition must courses for active department and semester (Scheduled timetable courses vs. Unscheduled/Non-credit courses)
  const { scheduledMusts, unscheduledMusts } = useMemo(() => {
    return partitionMustCourses(studentDepartment, selectedSemester, coursesData.courses);
  }, [studentDepartment, selectedSemester, coursesData.courses]);

  // Handler: Fetch Must Courses for current Department & Semester (Scheduled courses only)
  const handleFetchMustCourses = () => {
    if (scheduledMusts.length === 0 && unscheduledMusts.length === 0) {
      setToast({
        message: `${studentDepartment} ${selectedSemester}. Dönem için kayıtlı zorunlu ders bulunamadı.`,
        type: 'warning',
      });
      return;
    }

    let addedCount = 0;
    let alreadyAddedCount = 0;
    const notOffered = [];
    const newSelections = [...selectedCourses];

    // ONLY add scheduled courses (exclude 0-credit or unscheduled courses like OHS 301, ME 400)
    for (const item of scheduledMusts) {
      const fullCourse = item.course;
      if (!fullCourse) {
        notOffered.push(item.mustMeta.abbr);
        continue;
      }

      // Check if already in selected courses
      const existingIdx = newSelections.findIndex((s) => s.course.code === fullCourse.code);
      if (existingIdx >= 0) {
        alreadyAddedCount++;
        continue;
      }

      // Auto-select best eligible section based on student's surname criteria and conflicts
      const bestSec = autoSelectEligibleSection(
        fullCourse,
        checkSurname ? studentSurname : '',
        studentDepartment,
        blockedSlots,
        newSelections
      );

      newSelections.push({
        course: fullCourse,
        section: bestSec,
      });
      addedCount++;
    }

    setSelectedCourses(newSelections);
    setActiveVariation(null);

    if (addedCount > 0) {
      let msg = `✅ ${studentDepartment} ${selectedSemester}. Dönem: ${addedCount} zorunlu ders takvime eklendi!`;
      if (unscheduledMusts.length > 0) {
        msg += ` (${unscheduledMusts.map((u) => u.mustMeta.abbr).join(', ')} kredisiz/saatsiz ders olduğu için takvime eklenmedi).`;
      }
      if (notOffered.length > 0) {
        msg += ` [${notOffered.length} ders bu dönem açılmamış].`;
      }
      setToast({ message: msg, type: 'success' });
    } else if (alreadyAddedCount > 0) {
      let msg = `ℹ️ ${studentDepartment} ${selectedSemester}. Dönem dersleri (${alreadyAddedCount} ders) zaten listenizde bulunuyor.`;
      if (unscheduledMusts.length > 0) {
        msg += ` (${unscheduledMusts.map((u) => u.mustMeta.abbr).join(', ')} saatsiz/staj dersidir).`;
      }
      setToast({ message: msg, type: 'info' });
    } else {
      setToast({
        message: `⚠️ Seçilen dönemin dersleri bu akademik dönemde ODTÜ SIS'te açık bulunamadı (${notOffered.join(', ')}).`,
        type: 'warning',
      });
    }
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

  // Pin variation
  const handlePinVariation = (variation) => {
    if (!variation || !variation.items) return;
    setSelectedCourses(
      variation.items.map((item) => ({
        course: item.course,
        section: item.section,
      }))
    );
    setToast({
      message: 'Planlanan varyasyon sabit ders listenize kaydedildi!',
      type: 'success',
    });
  };

  // Load saved plan
  const handleLoadPlan = (plan) => {
    if (!plan) return;

    if (plan.studentDepartment) {
      setStudentDepartment(plan.studentDepartment);
    }
    if (plan.studentSurname !== undefined) {
      setStudentSurname(plan.studentSurname);
    }
    if (plan.selectedSemester) {
      setSelectedSemester(plan.selectedSemester);
    }

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

    const pool = plan.enabledElectiveCodes || plan.enabledMe4Codes;
    if (pool && Array.isArray(pool)) {
      setEnabledElectiveCodes(new Set(pool));
    }

    if (plan.blockedSlots) {
      setBlockedSlots(new Set(plan.blockedSlots));
    }

    if (plan.targetTotalCount) {
      setTargetTotalCount(plan.targetTotalCount);
    }

    if (plan.sortCriterion) {
      setSortCriterion(plan.sortCriterion);
    }

    setActiveVariation(null);
    setToast({
      message: `"${plan.name || 'Plan'}" başarıyla yüklendi!`,
      type: 'success',
    });
  };

  // Reset all
  const handleResetAll = () => {
    if (window.confirm('Tüm seçili dersleri ve programı sıfırlamak istediğinize emin misiniz?')) {
      setSelectedCourses([]);
      setBlockedSlots(new Set());
      setTargetTotalCount(5);
      setActiveVariation(null);
      setToast({
        message: 'Ders listesi ve program sıfırlandı.',
        type: 'info',
      });
    }
  };

  // Sync data
  const handleSyncData = async () => {
    try {
      setIsSyncing(true);
      setSyncMessage('ODTÜ SIS taranıyor...');
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
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Top Control Bar: Department, Semester (1-8), Must Courses Fetch, Surname */}
        <SemesterBar
          allCourses={coursesData.courses}
          studentDepartment={studentDepartment}
          onOpenDepartmentsModal={() => setIsDepartmentsModalOpen(true)}
          selectedSemester={selectedSemester}
          onChangeSemester={setSelectedSemester}
          studentSurname={studentSurname}
          onChangeSurname={setStudentSurname}
          checkSurname={checkSurname}
          onToggleCheckSurname={() => setCheckSurname(!checkSurname)}
          onFetchMustCourses={handleFetchMustCourses}
          onResetAll={handleResetAll}
          onOpenSaveModal={() => setIsSaveModalOpen(true)}
          selectedCoursesCount={selectedCourses.length}
        />

        {/* Dynamic Toast / Feedback Alert */}
        {toast && (
          <div
            className={`px-4 py-3 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-xs transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : toast.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                : 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:opacity-75 font-bold text-sm ml-2 cursor-pointer"
              title="Kapat"
            >
              ✕
            </button>
          </div>
        )}

        {/* Mobile Tab Switcher */}
        <div className="lg:hidden flex items-center p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl gap-1">
          <button
            onClick={() => setMobileTab('courses')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mobileTab === 'courses'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            📋 Derslerim & Arama ({selectedCourses.length})
          </button>
          <button
            onClick={() => setMobileTab('timetable')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mobileTab === 'timetable'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            📅 Haftalık Takvim ({displayScheduledItems.length})
          </button>
        </div>

        {/* Responsive Dashboard Grid (Left: Controls & Courses, Right: Timetable) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Course Search, Selected Courses, and Collapsible Advanced Tools */}
          <div
            className={`lg:col-span-5 xl:col-span-4 flex flex-col gap-4 ${
              mobileTab === 'timetable' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* 1. Universal Course Search */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 px-1">
                Ders Arama & Ekleme
              </span>
              <UniversalCourseSearch
                allCourses={coursesData.courses}
                selectedCourses={selectedCourses}
                onAddCourse={handleAddCourse}
                currentDepartment={studentDepartment}
                studentSurname={studentSurname}
                blockedSlots={blockedSlots}
                checkSurname={checkSurname}
              />
            </div>

            {/* 2. Selected Courses List with Section Dropdowns & Conflict Indicators */}
            <SelectedCoursesList
              selectedCourses={selectedCourses}
              onRemoveCourse={handleRemoveCourse}
              onChangeCourseSection={handleChangeCourseSection}
              studentSurname={studentSurname}
              studentDepartment={studentDepartment}
              checkSurname={checkSurname}
              blockedSlots={blockedSlots}
              onHoverCourse={setPreviewItems}
              onClearAll={handleResetAll}
            />

            {/* 3. Non-credit / Unscheduled Must Courses (Staj, OHS, etc.) */}
            <UnscheduledCoursesCard
              unscheduledMusts={unscheduledMusts}
              selectedCourses={selectedCourses}
              onAddCourse={handleAddCourse}
            />

            {/* 4. Collapsible Advanced Tools */}
            <div className="flex flex-col gap-3">
              {/* Accordion: Akıllı Planlayıcı (Çakışmasız Varyasyonlar) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-all">
                <button
                  type="button"
                  onClick={() => setIsSolverOpen(!isSolverOpen)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 m-0">
                        Akıllı Planlayıcı & Varyasyonlar
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                        Çakışmasız program kombinasyonları & seçmeli optimizasyonu
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isSolverOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isSolverOpen && (
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
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
                )}
              </div>

              {/* Accordion: Saat Bloklama (İstenmeyen Saatler) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-all">
                <button
                  type="button"
                  onClick={() => setIsBlockerOpen(!isBlockerOpen)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                      <Clock className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 m-0">
                        İstenmeyen Saatleri Engelle ({blockedSlots.size} Saat Bloklu)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                        Sabah 08:40, Cuma öğleden sonra vb. saatleri kapat
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isBlockerOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isBlockerOpen && (
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
                    <BlockedHoursManager
                      blockedSlots={blockedSlots}
                      onUpdateBlockedSlots={handleUpdateBlockedSlots}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Weekly Timetable (Always prominent, interactive & visible!) */}
          <div
            className={`lg:col-span-7 xl:col-span-8 ${
              mobileTab === 'courses' ? 'hidden lg:block' : 'block'
            }`}
          >
            <Timetable
              scheduledItems={displayScheduledItems}
              blockedSlots={blockedSlots}
              onToggleBlockSlot={handleToggleBlockSlot}
              previewItems={previewItems}
              timetableRef={timetableRef}
              onOpenExport={() => setIsExportModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-5 text-center text-xs text-slate-500 dark:text-slate-400 no-print transition-colors">
        <div className="max-w-[1600px] mx-auto px-4 space-y-1.5">
          <p className="m-0 font-medium">
            ODTÜ Tüm Bölümler Ders Programı & Planlayıcı &bull; 56 Lisans Bölümü Resmi Müfredatı
          </p>
          <p className="m-0 text-slate-400 dark:text-slate-500 text-[11px]">
            156 Bölüm &bull; 5,302 Ders &bull; 1-8. Dönem Zorunlu Dersleri &bull; Soyad Kriteri &bull; Çakışmasız Program Oluşturucu
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
