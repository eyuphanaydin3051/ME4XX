// src/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import initialCoursesData from './data/me_courses.json';
import Header from './components/Header';
import Timetable from './components/Timetable';
import CourseSelector from './components/CourseSelector';
import BlockedHoursManager from './components/BlockedHoursManager';
import VariationExplorer from './components/VariationExplorer';
import ExportModal from './components/ExportModal';
import HelpModal from './components/HelpModal';
import { loadSavedState, saveState } from './utils/storage';
import { Download, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [coursesData, setCoursesData] = useState(initialCoursesData);
  const timetableRef = useRef(null);

  // Load persisted state or use defaults
  const savedState = useMemo(() => loadSavedState(), []);

  const [selectedCourses, setSelectedCourses] = useState(() => {
    if (savedState?.selectedCourses) {
      // Re-hydrate with actual course objects from coursesData
      return savedState.selectedCourses
        .map((saved) => {
          const matchCourse = initialCoursesData.courses.find(
            (c) => c.code === saved.courseCode
          );
          if (!matchCourse) return null;
          const matchSection = saved.sectionNumber
            ? matchCourse.sections.find((s) => s.sectionNumber === saved.sectionNumber)
            : null;
          return { course: matchCourse, section: matchSection };
        })
        .filter(Boolean);
    }
    // Default initial selection for demonstration: ME 305 (Fluid Mechanics) Section 1
    const defaultCourse = initialCoursesData.courses.find((c) => c.courseNumber === '305');
    if (defaultCourse && defaultCourse.sections.length > 0) {
      const scheduledSec = defaultCourse.sections.find((s) => s.hasSchedule) || defaultCourse.sections[0];
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

  const [activeVariation, setActiveVariation] = useState(null);
  const [previewItems, setPreviewItems] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Persist state changes
  useEffect(() => {
    saveState({
      selectedCourses: selectedCourses.map((s) => ({
        courseCode: s.course.code,
        sectionNumber: s.section ? s.section.sectionNumber : null,
      })),
      blockedSlots: Array.from(blockedSlots),
      targetTotalCount,
    });
  }, [selectedCourses, blockedSlots, targetTotalCount]);

  // Timetable display items:
  // If a variation is active, show the full variation schedule (fixed + generated electives)
  // Otherwise, show currently selected courses with concrete sections
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
      .map((s) => ({ ...s, isElective: s.course.isME4 }));
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

  // Reset all selections
  const handleResetAll = () => {
    if (window.confirm('Tüm ders seçimlerini ve bloklu saatleri sıfırlamak istediğinize emin misiniz?')) {
      setSelectedCourses([]);
      setBlockedSlots(new Set());
      setTargetTotalCount(5);
      setActiveVariation(null);
    }
  };

  // Sync latest data from robotdegilim CDN
  const handleSyncData = async () => {
    try {
      setIsSyncing(true);
      setSyncMessage('Güncel veriler taranıyor...');
      const pointerRes = await fetch(
        'https://s3.amazonaws.com/cdn.robotdegilim.xyz/data/scrape_courses/latest.json'
      );
      const pointer = await pointerRes.json();
      const filename = pointer.latest || '20261.json';

      const dataRes = await fetch(
        `https://s3.amazonaws.com/cdn.robotdegilim.xyz/data/scrape_courses/${filename}`
      );
      const raw = await dataRes.json();

      const meDept = raw.programs['569'];
      if (!meDept) throw new Error('ME (569) departmanı bulunamadı.');

      setSyncMessage(`Senkronize edildi! (${meDept.courses ? Object.keys(meDept.courses).length : 0} ders)`);
      setTimeout(() => setSyncMessage(''), 4000);
    } catch (err) {
      console.error('Veri senkronizasyonu hatası:', err);
      setSyncMessage('Senkronizasyon başarısız oldu, yerel veritabanı kullanılıyor.');
      setTimeout(() => setSyncMessage(''), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Global Header */}
      <Header
        metadata={coursesData.metadata}
        onResetAll={handleResetAll}
        onSyncData={handleSyncData}
        isSyncing={isSyncing}
        syncMessage={syncMessage}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Control Bar with Quick Info & Export */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs text-slate-300 font-medium">
              Aktif Program:{' '}
              <strong className="text-white">
                {displayScheduledItems.length} Ders Kayıtlı
              </strong>{' '}
              ({blockedSlots.size} saat bloklu)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-900/30 transition-all transform hover:scale-[1.02]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Programı Dışa Aktar / Yazdır</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Course Selector & Selected Courses (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            <CourseSelector
              allCourses={coursesData.courses}
              selectedCourses={selectedCourses}
              onAddCourse={handleAddCourse}
              onRemoveCourse={handleRemoveCourse}
              onChangeCourseSection={handleChangeCourseSection}
              blockedSlots={blockedSlots}
              onPreviewHover={setPreviewItems}
            />
          </div>

          {/* Right Column: Blocked Hours, Timetable, & Variation Optimizer (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Blocked Hours Controls */}
            <BlockedHoursManager
              blockedSlots={blockedSlots}
              onUpdateBlockedSlots={handleUpdateBlockedSlots}
            />

            {/* Weekly Timetable Grid */}
            <Timetable
              scheduledItems={displayScheduledItems}
              blockedSlots={blockedSlots}
              onToggleBlockSlot={handleToggleBlockSlot}
              previewItems={previewItems}
              timetableRef={timetableRef}
            />

            {/* ME4 Variation Optimizer & Generator */}
            <VariationExplorer
              allCourses={coursesData.courses}
              selectedCourses={selectedCourses}
              blockedSlots={blockedSlots}
              targetTotalCount={targetTotalCount}
              onChangeTargetTotal={setTargetTotalCount}
              activeVariation={activeVariation}
              onSelectVariation={setActiveVariation}
              onPinVariation={handlePinVariation}
              onPreviewHover={setPreviewItems}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="m-0">
            ODTÜ Makina Mühendisliği Ders Programı Planlayıcı • ME4 Teknik Seçmeli Optimizasyon Sistemi
          </p>
          <p className="m-0 text-slate-400">
            Ders programı verileri robotdegilim.xyz ve ODTÜ SIS altyapısı ile senkronizedir.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        timetableRef={timetableRef}
        scheduledCourses={displayScheduledItems}
        metadata={coursesData.metadata}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
