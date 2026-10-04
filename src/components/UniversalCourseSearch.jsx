// src/components/UniversalCourseSearch.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Check, BookOpen, AlertCircle, X, Layers, Sparkles, Info } from 'lucide-react';
import { autoSelectEligibleSection } from '../utils/curriculum';

const normalise = (text) =>
  String(text || '')
    .replace(/[ıİ]/g, 'i')
    .toLocaleUpperCase('en')
    .trim();

export default function UniversalCourseSearch({
  allCourses = [],
  selectedCourses = [],
  onAddCourse,
  currentDepartment = 'ME',
  studentSurname = '',
  blockedSlots = new Set(),
  checkSurname = true,
  checkDepartment = true,
  checkCollision = true,
  onOpenDetails,
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef(null);

  // Selected course codes set for fast lookup
  const selectedCodeSet = useMemo(() => {
    return new Set(selectedCourses.map((s) => s.course.code));
  }, [selectedCourses]);

  // Filter courses based on query
  const searchResults = useMemo(() => {
    const needle = normalise(query);
    if (!needle || needle.length < 2) return [];

    const needleClean = needle.replace(/\s+/g, '');

    const rank = (c) => {
      const codeStr = normalise(c.codeStr);
      const codeStrClean = codeStr.replace(/\s+/g, '');
      const codeNum = normalise(c.code);
      const name = normalise(c.name);

      if (codeStrClean === needleClean || codeNum === needleClean) return 0;
      if (codeStrClean.startsWith(needleClean)) return 1;
      if (name.startsWith(needle)) return 2;
      if (codeStr.includes(needle)) return 3;
      if (name.includes(needle)) return 4;
      return 5;
    };

    const matches = allCourses.filter((c) => {
      const codeStr = normalise(c.codeStr);
      const codeStrClean = codeStr.replace(/\s+/g, '');
      const codeNum = normalise(c.code);
      const name = normalise(c.name);

      return (
        codeStrClean.includes(needleClean) ||
        codeNum.includes(needleClean) ||
        name.includes(needle)
      );
    });

    return matches.sort((a, b) => rank(a) - rank(b)).slice(0, 30);
  }, [allCourses, query]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = searchResults[selectedIndex];
      if (target) {
        handleSelectCourse(target);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectCourse = (course) => {
    const bestSection = autoSelectEligibleSection(
      course,
      studentSurname,
      currentDepartment,
      blockedSlots,
      selectedCourses,
      { checkDept: checkDepartment, checkSurname, checkCollision }
    );
    onAddCourse(course, bestSection);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Container */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none flex items-center">
          <Search className="w-4 h-4" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="ODTÜ ders ara (Örn: MATH 119, CENG 213, PHYS 105, 5710213, Calculus, Algorithms...)"
          className="w-full pl-10 pr-24 py-2.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-slate-900/90 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs transition-all"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              Tüm Okul
            </span>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-96 flex flex-col animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Arama Sonuçları ({searchResults.length}{' '}
              {searchResults.length >= 30 ? '+' : ''})
            </span>
            <span className="text-[11px] text-slate-400">
              Yön tuşları ile seçin, Enter ile ekleyin
            </span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50 p-1">
            {searchResults.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">"{query}" ile eşleşen ODTÜ dersi bulunamadı.</p>
                <p className="text-[11px] text-slate-500">
                  Ders kodunu (örn: MATH 119) veya adını deneyin.
                </p>
              </div>
            ) : (
              searchResults.map((course, idx) => {
                const isSelected = selectedCodeSet.has(course.code);
                const isHighlighted = idx === selectedIndex;

                return (
                  <div
                    key={course.code}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => handleSelectCourse(course)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      isHighlighted
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                          {course.codeStr}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {course.department || course.departmentCode}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {course.code}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">
                        {course.name}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span>{course.credits?.total || 0} Kredi</span>
                        <span>•</span>
                        <span>{course.credits?.ects || 0} AKTS</span>
                        <span>•</span>
                        <span>{course.sections?.length || 0} Şube</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenDetails) onOpenDetails(course);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        title={`${course.codeStr} detaylarını ve kriterlerini gör`}
                      >
                        <Info className="w-4 h-4" />
                      </button>

                      {isSelected ? (
                        <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <Check className="w-3.5 h-3.5" />
                          <span>Eklendi</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectCourse(course);
                          }}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-transform transform active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Ekle</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
