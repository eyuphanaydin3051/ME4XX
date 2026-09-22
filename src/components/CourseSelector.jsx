// src/components/CourseSelector.jsx
import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Building,
  GraduationCap,
  Layers,
  FileText,
  ExternalLink,
  Mail,
} from 'lucide-react';
import { schedulesConflict, sectionConflictsWithBlocked } from '../utils/timeSlots';
import { getCourseColor } from '../utils/colors';
import { getRegistrationInfo, REG_TYPE_CONFIG } from '../utils/registration';

const CATEGORIES = [
  { id: 'all', label: 'Tüm ME Dersleri' },
  { id: '1. Sınıf', label: '1. Sınıf (1xx)' },
  { id: '2. Sınıf', label: '2. Sınıf (2xx)' },
  { id: '3. Sınıf', label: '3. Sınıf (3xx)' },
  { id: '4. Sınıf (Teknik Seçmeli)', label: '4. Sınıf (4xx Seçmeli)' },
  { id: 'Lisansüstü', label: 'Lisansüstü (5xx+)' },
];

export default function CourseSelector({
  allCourses = [],
  selectedCourses = [], // [{ course, section }] where section can be specific or null
  onAddCourse,
  onRemoveCourse,
  onChangeCourseSection,
  blockedSlots = new Set(),
  onPreviewHover, // (items or null)
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedCourseCode, setExpandedCourseCode] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter courses based on search & category
  const filteredCourses = useMemo(() => {
    return allCourses.filter((course) => {
      // Category filter
      if (selectedCategory !== 'all' && course.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = course.codeStr.toLowerCase().includes(q) || course.code.includes(q);
        const nameMatch = course.name.toLowerCase().includes(q);
        if (!codeMatch && !nameMatch) return false;
      }
      return true;
    });
  }, [allCourses, selectedCategory, searchQuery]);

  // Check whether a specific section conflicts with current schedule or blocks
  const checkSectionConflict = (targetCourse, targetSection) => {
    if (!targetSection || !targetSection.hasSchedule) return null;

    // Check with blocked hours
    if (sectionConflictsWithBlocked(targetSection.schedule, blockedSlots)) {
      return 'Bloklu saatlerle çakışıyor';
    }

    // Check with already selected courses (excluding self)
    for (const item of selectedCourses) {
      if (item.course.code === targetCourse.code) continue;
      if (item.section && schedulesConflict(item.section.schedule, targetSection.schedule)) {
        return `${item.course.codeStr} (Sec ${item.section.sectionNumber}) ile çakışıyor`;
      }
    }

    return null;
  };

  // Total credits calculation
  const totalCredits = useMemo(() => {
    return selectedCourses.reduce((acc, curr) => acc + (curr.course.credits?.total || 0), 0);
  }, [selectedCourses]);

  const totalECTS = useMemo(() => {
    return selectedCourses.reduce((acc, curr) => acc + (curr.course.credits?.ects || 0), 0);
  }, [selectedCourses]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col w-full overflow-hidden transition-all">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider m-0">
                  ME Ders Kataloğu (Makina Mühendisliği)
                </h2>
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {allCourses.length} Ders Kayıtlı
                </span>
              </div>
              <p className="text-xs text-slate-400 m-0">
                Almak istediğiniz sabit dersleri ve section'ları seçin. Kalan seçmelileri aşağıdaki optimizatör tamamlayacaktır.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedCourses.length > 0 && (
              <div className="flex items-center gap-2 text-xs bg-indigo-950/40 text-indigo-300 px-3 py-1.5 rounded-xl border border-indigo-500/30">
                <span className="font-bold text-white">{selectedCourses.length}</span> Ders Seçildi
                <span>•</span>
                <span>{totalCredits} Kredi</span>
                <span>•</span>
                <span>{totalECTS} AKTS</span>
              </div>
            )}

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Kataloğu Genişlet</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Kataloğu Daralt</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Selected Courses Bar (Always visible if any selected) */}
        {selectedCourses.length > 0 && (
          <div className="mt-3 p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold">
              <span className="uppercase tracking-wider">Sabit Seçilen Dersler ({selectedCourses.length}):</span>
              <span className="text-[11px] text-slate-400 font-normal">Section değiştirebilir veya silebilirsiniz</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
              {selectedCourses.map(({ course, section }) => {
                const conflict = checkSectionConflict(course, section);

                return (
                  <div
                    key={course.code}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                  >
                    <div className="min-w-0 pr-1">
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{course.codeStr}</span>
                        {conflict && (
                          <span
                            title={conflict}
                            className="p-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          >
                            <AlertTriangle className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                        {course.name}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={section ? section.sectionNumber : 'any'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'any') {
                            onChangeCourseSection(course.code, null);
                          } else {
                            const targetSec = course.sections.find(
                              (s) => s.sectionNumber === parseInt(val, 10)
                            );
                            onChangeCourseSection(course.code, targetSec);
                          }
                        }}
                        className="px-1.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none"
                      >
                        <option value="any">Herhangi Sec</option>
                        {course.sections.map((s) => (
                          <option key={s.sectionNumber} value={s.sectionNumber}>
                            Sec {s.sectionNumber}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => onRemoveCourse(course.code)}
                        title="Kaldır"
                        className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search & Category Filter Bar */}
        {!isCollapsed && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Ders kodu veya adı ara (örn: 305, Fluid, 402)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl shrink-0 transition-all font-medium ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Course List Grid (Multi-Column Layout for Full-Width Card) */}
      {!isCollapsed && (
        <div className="p-4 overflow-y-auto max-h-[380px]">
          {filteredCourses.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Arama kriterine uygun ders bulunamadı.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredCourses.map((course) => {
                const isSelected = selectedCourses.some((s) => s.course.code === course.code);
                const isExpanded = expandedCourseCode === course.code;
                const scheduledSections = course.sections.filter((s) => s.hasSchedule);
                const regInfo = getRegistrationInfo(course.codeStr);
                const regCfg = regInfo ? REG_TYPE_CONFIG[regInfo.type] : null;

                return (
                  <div
                    key={course.code}
                    className={`rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600/60 bg-indigo-950/20'
                        : isExpanded
                        ? 'border-slate-700 bg-slate-800/40'
                        : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    {/* Course Card Summary Line */}
                    <div
                      onClick={() =>
                        setExpandedCourseCode(isExpanded ? null : course.code)
                      }
                      className="p-3 flex items-center justify-between cursor-pointer select-none gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            course.isME4
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-200 border border-slate-700'
                          }`}
                        >
                          {course.codeStr}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-200 truncate" title={course.name}>
                            {course.name}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span>{scheduledSections.length} Aktif Section</span>
                            {course.credits?.total > 0 && (
                              <span>• {course.credits.total} Kredi ({course.credits.ects} AKTS)</span>
                            )}
                            {regCfg && (
                              <span className={`px-1.5 py-0.2 rounded-full font-semibold border ${regCfg.badgeClass}`}>
                                {regCfg.shortLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <Check className="w-3 h-3" /> Eklendi
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Section Details */}
                    {isExpanded && (
                      <div className="p-3 pt-0 border-t border-slate-800/60 space-y-2 mt-1">
                        {/* 2026-2027 Fall Registration Info Callout (from PDF) */}
                        {regInfo && (
                          <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs space-y-1.5 shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-bold text-purple-300">
                                <FileText className="w-3.5 h-3.5 text-purple-400" />
                                <span>Kayıt Yöntemi: {regCfg?.label}</span>
                              </div>
                              {regInfo.formUrl && (
                                <a
                                  href={regInfo.formUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold shadow-sm transition-all"
                                >
                                  <span>{regInfo.formName || 'Formu Aç'}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 leading-normal m-0">
                              {regInfo.notes}
                            </p>
                            <div className="text-[10.5px] text-purple-200/90 flex flex-wrap items-center gap-1 font-medium pt-0.5 border-t border-purple-800/40">
                              <span>Asistan: {regInfo.assistant}</span>
                              <span>•</span>
                              <a
                                href={`mailto:${regInfo.email}?subject=${encodeURIComponent(
                                  course.codeStr + ' Kayıt Bilgisi'
                                )}`}
                                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                              >
                                <Mail className="w-2.5 h-2.5 inline" /> {regInfo.email}
                              </a>
                            </div>
                          </div>
                        )}

                        <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                          <span>Section Seçimi & Ders Saatleri:</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSelected) {
                                onRemoveCourse(course.code);
                              } else {
                                const firstSec = scheduledSections[0] || course.sections[0] || null;
                                onAddCourse(course, firstSec);
                              }
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                              isSelected
                                ? 'text-rose-400 hover:bg-rose-500/10'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                          >
                            {isSelected ? 'Programdan Çıkar' : 'Herhangi Bir Section Ekle'}
                          </button>
                        </div>

                        {course.sections.length === 0 ? (
                          <div className="text-slate-500 text-xs italic">
                            Bu ders için açık section bulunmuyor.
                          </div>
                        ) : (
                          course.sections.map((sec) => {
                            const conflict = checkSectionConflict(course, sec);
                            const isThisSecSelected = selectedCourses.some(
                              (s) =>
                                s.course.code === course.code &&
                                s.section?.sectionNumber === sec.sectionNumber
                            );

                            return (
                              <div
                                key={sec.sectionNumber}
                                onMouseEnter={() => {
                                  if (sec.hasSchedule) {
                                    onPreviewHover([{ course, section: sec }]);
                                  }
                                }}
                                onMouseLeave={() => onPreviewHover(null)}
                                className={`p-2 rounded-lg border text-xs transition-all flex flex-col gap-1 ${
                                  isThisSecSelected
                                    ? 'bg-indigo-600/20 border-indigo-500/60'
                                    : conflict
                                    ? 'bg-rose-950/20 border-rose-900/40 text-slate-400'
                                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-200">
                                      Section {sec.sectionNumber}
                                    </span>
                                    {conflict ? (
                                      <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                        <AlertTriangle className="w-2.5 h-2.5" />
                                        {conflict}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                        Uygun
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => {
                                      if (isThisSecSelected) {
                                        onRemoveCourse(course.code);
                                      } else {
                                        onAddCourse(course, sec);
                                      }
                                    }}
                                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                                      isThisSecSelected
                                        ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                                        : 'bg-indigo-600/80 hover:bg-indigo-600 text-white'
                                    }`}
                                  >
                                    {isThisSecSelected ? 'Seçimi Kaldır' : 'Bu Sectionı Seç'}
                                  </button>
                                </div>

                                {/* Schedule Hours */}
                                {sec.schedule?.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {sec.schedule.map((s, sIdx) => (
                                      <span
                                        key={sIdx}
                                        className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 flex items-center gap-1"
                                      >
                                        <Clock className="w-2.5 h-2.5 text-indigo-400" />
                                        {s.dayTr} {s.startHour} - {s.endHour} ({s.classroom || 'ME'})
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-500 italic">
                                    Belirtilmiş saat yok
                                  </span>
                                )}

                                {/* Instructors (Full Name) */}
                                {sec.instructors?.length > 0 && (
                                  <div className="text-[10.5px] text-slate-300 flex items-center gap-1 font-medium">
                                    <User className="w-2.5 h-2.5 text-slate-400 inline shrink-0" />
                                    <span>{sec.instructors.map((i) => i.name).join(', ')}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
