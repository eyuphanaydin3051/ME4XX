import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Trash2,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  User,
  FileText,
  ExternalLink,
  Building2,
  ShieldAlert,
} from 'lucide-react';
import { schedulesConflict, sectionConflictsWithBlocked } from '../utils/timeSlots';
import { getRegistrationInfo, REG_TYPE_CONFIG } from '../utils/registration';
import { getCoursePrerequisite } from '../utils/prerequisites';
import { evaluateSectionEligibility } from '../utils/surname';
import UniversalCourseSearch from './UniversalCourseSearch';

export default function CourseSelector({
  allCourses = [],
  departments = [],
  studentDepartment = 'ME',
  onChangeDepartment,
  onOpenDepartmentsModal,
  studentSurname = '',
  onChangeSurname,
  checkSurname = true,
  onToggleCheckSurname,
  checkDepartment = true,
  onToggleCheckDepartment,
  selectedCourses = [], // [{ course, section }]
  onAddCourse,
  onRemoveCourse,
  onChangeCourseSection,
  blockedSlots = new Set(),
  onPreviewHover,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all_dept');
  const [expandedCourseCode, setExpandedCourseCode] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterEligibleOnly, setFilterEligibleOnly] = useState(false);

  // Dynamic categories based on active department
  const categories = useMemo(() => {
    return [
      { id: 'all_dept', label: `Tüm ${studentDepartment} Dersleri` },
      { id: '1. Sınıf', label: '1. Sınıf (1xx)' },
      { id: '2. Sınıf', label: '2. Sınıf (2xx)' },
      { id: '3. Sınıf', label: '3. Sınıf (3xx)' },
      { id: '4. Sınıf', label: '4. Sınıf & Seçmeli (4xx)' },
      { id: 'Lisansüstü', label: 'Lisansüstü (5xx+)' },
      { id: 'all_university', label: 'Tüm ODTÜ Kataloğu' },
    ];
  }, [studentDepartment]);

  // Filter courses based on department, search & category
  const filteredCourses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const deptUpper = studentDepartment.toUpperCase();

    return allCourses.filter((course) => {
      const courseDept = (course.department || '').toUpperCase();

      // Category filter
      if (selectedCategory === 'all_dept') {
        if (courseDept !== deptUpper) return false;
      } else if (selectedCategory === 'all_university') {
        // no department filter
      } else if (selectedCategory === '4. Sınıf') {
        if (courseDept !== deptUpper) return false;
        if (!course.category?.startsWith('4. Sınıf')) return false;
      } else {
        if (courseDept !== deptUpper) return false;
        if (course.category !== selectedCategory) return false;
      }

      // Search query
      if (q) {
        const codeMatch =
          course.codeStr.toLowerCase().includes(q) ||
          course.code.includes(q) ||
          course.codeStr.replace(/\s+/g, '').toLowerCase().includes(q.replace(/\s+/g, ''));
        const nameMatch = course.name.toLowerCase().includes(q);
        if (!codeMatch && !nameMatch) return false;
      }

      return true;
    });
  }, [allCourses, studentDepartment, selectedCategory, searchQuery]);

  // Department courses count
  const deptCoursesCount = useMemo(() => {
    return allCourses.filter(
      (c) => (c.department || '').toUpperCase() === studentDepartment.toUpperCase()
    ).length;
  }, [allCourses, studentDepartment]);

  // Check whether a specific section conflicts with current schedule or blocks
  const checkSectionConflict = (targetCourse, targetSection) => {
    if (!targetSection || !targetSection.hasSchedule) return null;

    if (sectionConflictsWithBlocked(targetSection.schedule, blockedSlots)) {
      return 'Bloklu saatlerle çakışıyor';
    }

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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl flex flex-col w-full overflow-hidden transition-colors">
      {/* Top Universal Search Bar & Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 space-y-4">
        {/* Universal Search Bar across all 5,300+ courses */}
        <div className="w-full">
          <UniversalCourseSearch
            allCourses={allCourses}
            selectedCourses={selectedCourses}
            onAddCourse={onAddCourse}
            currentDepartment={studentDepartment}
          />
        </div>

        {/* Department & Surname Control Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          {/* Left: Department Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Bölümünüz ({deptCoursesCount} Ders):
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={studentDepartment}
                    onChange={(e) => onChangeDepartment(e.target.value)}
                    className="font-bold text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-indigo-600 dark:text-indigo-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    {/* Quick popular departments */}
                    <optgroup label="Popüler Bölümler">
                      {['CENG', 'ME', 'EE', 'IE', 'CE', 'CHE', 'AEE', 'MATH', 'PHYS', 'BA', 'ECON', 'ARCH'].map(
                        (abbr) => (
                          <option key={abbr} value={abbr}>
                            {abbr}
                          </option>
                        )
                      )}
                    </optgroup>
                    {/* All departments */}
                    <optgroup label="Tüm ODTÜ Bölümleri">
                      {departments.map((d) => (
                        <option key={d.code} value={d.abbr}>
                          {d.abbr} - {d.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  <button
                    onClick={onOpenDepartmentsModal}
                    className="px-2 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors"
                    title="Tüm Bölümler Listesi"
                  >
                    Bölüm Listesi ({departments.length})
                  </button>
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {/* Middle: Surname Input */}
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <User className="w-4 h-4" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Soyadınız (Kriter Kontrolü):
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={studentSurname}
                    onChange={(e) => onChangeSurname(e.target.value.toUpperCase())}
                    placeholder="Örn: AYDIN"
                    className="font-bold text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-900 dark:text-slate-100 w-28 uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                  {studentSurname.trim().length >= 2 && (
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {studentSurname.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Criteria Toggles & Collapse */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onToggleCheckSurname}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                checkSurname
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-transparent line-through'
              }`}
              title="Şube seçerken soyad aralığı kriterini kontrol et"
            >
              Soyad Kriteri: {checkSurname ? 'Açık' : 'Kapalı'}
            </button>

            <button
              onClick={onToggleCheckDepartment}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                checkDepartment
                  ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-transparent line-through'
              }`}
              title="Şube seçerken bölüm kriterini kontrol et"
            >
              Bölüm Kriteri: {checkDepartment ? 'Açık' : 'Kapalı'}
            </button>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-colors"
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Kataloğu Aç</span>
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
          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 rounded-2xl space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-900 dark:text-indigo-300 font-semibold">
              <div className="flex items-center gap-2">
                <span className="uppercase tracking-wider">
                  Seçilen Dersler ({selectedCourses.length}):
                </span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  {totalCredits} Kredi • {totalECTS} AKTS
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                Section değiştirebilir veya silebilirsiniz
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
              {selectedCourses.map(({ course, section }) => {
                const conflict = checkSectionConflict(course, section);
                const eligibility = section
                  ? evaluateSectionEligibility(section, studentDepartment, studentSurname, {
                      checkDept: checkDepartment,
                      checkSurname: checkSurname,
                    })
                  : null;

                return (
                  <div
                    key={course.code}
                    className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs shadow-2xs"
                  >
                    <div className="min-w-0 pr-1">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{course.codeStr}</span>
                        {conflict && (
                          <span
                            title={conflict}
                            className="p-0.5 rounded bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30"
                          >
                            <AlertTriangle className="w-3 h-3" />
                          </span>
                        )}
                        {eligibility && !eligibility.isAdmissible && (
                          <span
                            title={eligibility.details}
                            className="p-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          >
                            <ShieldAlert className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
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
                        className="px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-hidden"
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
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
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
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Category Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl shrink-0 transition-all font-medium border ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Filter Options (Hide Non-Eligible Sections) */}
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={filterEligibleOnly}
                  onChange={(e) => setFilterEligibleOnly(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Sadece kriterime uyan şubeleri göster</span>
              </label>

              {/* Local text filter */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Bu listede ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Course List Grid */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[460px]">
          {filteredCourses.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-slate-400 opacity-40" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Bu kategoride ders bulunamadı.
              </p>
              <p className="text-slate-400">
                Farklı bir sınıf sekmesi seçebilir veya yukarıdaki arama kutusundan istediğiniz dersi arayabilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredCourses.map((course) => {
                const isSelected = selectedCourses.some((s) => s.course.code === course.code);
                const isExpanded = expandedCourseCode === course.code;
                const scheduledSections = course.sections.filter((s) => s.hasSchedule);
                const regInfo = getRegistrationInfo(course.codeStr);
                const regCfg = regInfo ? REG_TYPE_CONFIG[regInfo.type] : null;

                // Visible sections based on filterEligibleOnly
                const visibleSections = course.sections.filter((sec) => {
                  if (!filterEligibleOnly) return true;
                  const el = evaluateSectionEligibility(sec, studentDepartment, studentSurname, {
                    checkDept: checkDepartment,
                    checkSurname: checkSurname,
                  });
                  return el.isAdmissible;
                });

                return (
                  <div
                    key={course.code}
                    className={`rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-400/60 dark:border-indigo-600/60 bg-indigo-50/70 dark:bg-indigo-950/20 shadow-xs'
                        : isExpanded
                        ? 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'
                        : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Course Card Summary Line */}
                    <div
                      onClick={() => setExpandedCourseCode(isExpanded ? null : course.code)}
                      className="p-3.5 flex items-center justify-between cursor-pointer select-none gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ${
                            course.isMust || course.category?.includes('Zorunlu')
                              ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                              : course.isME4 || course.category?.includes('Seçmeli')
                              ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {course.codeStr}
                        </span>

                        <div className="min-w-0">
                          <div
                            className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate"
                            title={course.name}
                          >
                            {course.name}
                          </div>
                          <div className="text-[10.5px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
                            <span>{course.sections.length} Section</span>
                            {course.credits?.total > 0 && (
                              <span>
                                • {course.credits.total} Kredi ({course.credits.ects} AKTS)
                              </span>
                            )}
                            {course.department && (
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                • {course.department}
                              </span>
                            )}
                            {getCoursePrerequisite(course.codeStr) && (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                • Ön Şart: {getCoursePrerequisite(course.codeStr)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
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
                      <div className="p-3.5 pt-0 border-t border-slate-200 dark:border-slate-800/60 space-y-2.5 mt-1">
                        {/* 4xx Registration Info Callout if available */}
                        {regInfo && (
                          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/40 text-xs space-y-1.5 shadow-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-bold text-purple-800 dark:text-purple-300">
                                <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                <span>Kayıt Yöntemi: {regCfg?.label}</span>
                              </div>
                              {regInfo.formUrl && (
                                <a
                                  href={regInfo.formUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold shadow-xs transition-all"
                                >
                                  <span>{regInfo.formName || 'Formu Aç'}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-normal m-0">
                              {regInfo.notes}
                            </p>
                          </div>
                        )}

                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                          <span>Section Seçimi & Kriterler:</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSelected) {
                                onRemoveCourse(course.code);
                              } else {
                                const firstSec =
                                  scheduledSections.find((s) => {
                                    const el = evaluateSectionEligibility(
                                      s,
                                      studentDepartment,
                                      studentSurname,
                                      { checkDept: checkDepartment, checkSurname: checkSurname }
                                    );
                                    return el.isAdmissible;
                                  }) ||
                                  scheduledSections[0] ||
                                  course.sections[0] ||
                                  null;
                                onAddCourse(course, firstSec);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors ${
                              isSelected
                                ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                            }`}
                          >
                            {isSelected ? 'Programdan Kaldır' : 'Herhangi Bir Section Ekle'}
                          </button>
                        </div>

                        {visibleSections.length === 0 ? (
                          <div className="text-slate-500 text-xs italic py-2">
                            {filterEligibleOnly
                              ? 'Kriterinize uygun açık section bulunamadı.'
                              : 'Bu ders için açık section bulunmuyor.'}
                          </div>
                        ) : (
                          visibleSections.map((sec) => {
                            const conflict = checkSectionConflict(course, sec);
                            const isThisSecSelected = selectedCourses.some(
                              (s) =>
                                s.course.code === course.code &&
                                s.section?.sectionNumber === sec.sectionNumber
                            );

                            const eligibility = evaluateSectionEligibility(
                              sec,
                              studentDepartment,
                              studentSurname,
                              { checkDept: checkDepartment, checkSurname: checkSurname }
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
                                className={`p-2.5 rounded-xl border text-xs transition-all flex flex-col gap-1.5 ${
                                  isThisSecSelected
                                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-500/60 shadow-2xs'
                                    : conflict
                                    ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-slate-500 dark:text-slate-400'
                                    : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-slate-900 dark:text-slate-100">
                                      Section {sec.sectionNumber}
                                    </span>

                                    {/* Criteria / Eligibility Badge */}
                                    <span
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${eligibility.badgeClass}`}
                                      title={eligibility.details}
                                    >
                                      {eligibility.badgeLabel}
                                    </span>

                                    {conflict && (
                                      <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md border border-rose-500/20">
                                        {conflict}
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onAddCourse(course, sec);
                                    }}
                                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                                      isThisSecSelected
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    {isThisSecSelected ? '✓ Seçili' : 'Seç'}
                                  </button>
                                </div>

                                {/* Instructors & Capacity */}
                                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                  <div className="flex items-center gap-1">
                                    <User className="w-3 h-3 text-slate-400" />
                                    <span>
                                      {sec.instructors && sec.instructors.length > 0
                                        ? sec.instructors.map((i) => i.name).join(', ')
                                        : 'STAFF'}
                                    </span>
                                  </div>
                                  {sec.capacity?.total > 0 && (
                                    <span>Kontenjan: {sec.capacity.total}</span>
                                  )}
                                </div>

                                {/* Schedule Slots List */}
                                {sec.schedule && sec.schedule.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {sec.schedule.map((sch, sIdx) => (
                                      <span
                                        key={sIdx}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono"
                                      >
                                        {sch.dayTr || sch.dayEn} {sch.startHour}-{sch.endHour}{' '}
                                        {sch.classroom ? `(${sch.classroom})` : ''}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-slate-400 italic">
                                    Ders saati henüz girilmemiş (Program dışı)
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
