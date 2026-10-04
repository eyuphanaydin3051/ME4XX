// src/components/SelectedCoursesList.jsx
import React, { useMemo } from 'react';
import {
  Trash2,
  AlertTriangle,
  CheckCircle,
  Building,
  User,
  Clock,
  BookOpen,
  Info,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { evaluateSectionEligibility } from '../utils/surname';
import { schedulesConflict, sectionConflictsWithBlocked } from '../utils/timeSlots';
import { getCourseColor } from '../utils/colors';

export default function SelectedCoursesList({
  selectedCourses = [], // [{ course, section }]
  onRemoveCourse,
  onChangeCourseSection,
  studentSurname = '',
  studentDepartment = 'ME',
  checkSurname = true,
  blockedSlots = new Set(),
  onHoverCourse,
  onClearAll,
}) {
  // Check conflicts for a course's selected section
  const getCourseConflicts = (item) => {
    if (!item.section || !item.section.hasSchedule) return [];
    const conflicts = [];

    // 1. Conflict with blocked slots
    if (sectionConflictsWithBlocked(item.section.schedule, blockedSlots)) {
      conflicts.push({ type: 'blocked', text: 'İstenmeyen (bloklu) saatle çakışıyor' });
    }

    // 2. Conflict with other selected courses
    for (const other of selectedCourses) {
      if (other.course.code === item.course.code) continue;
      if (other.section && schedulesConflict(other.section.schedule, item.section.schedule)) {
        conflicts.push({
          type: 'course',
          text: `${other.course.codeStr} (Sec ${other.section.sectionNumber}) ile çakışıyor`,
        });
      }
    }

    return conflicts;
  };

  // Total credits and hours summary
  const summary = useMemo(() => {
    let totalCredits = 0;
    let totalWeeklyHours = 0;
    let conflictCount = 0;

    for (const item of selectedCourses) {
      if (item.course.credit) {
        totalCredits += Number(item.course.credit) || 0;
      }
      if (item.section && item.section.schedule) {
        for (const block of item.section.schedule) {
          totalWeeklyHours += (block.slots || []).length;
        }
      }
      const c = getCourseConflicts(item);
      if (c.length > 0) conflictCount++;
    }

    return { totalCredits, totalWeeklyHours, conflictCount };
  }, [selectedCourses, blockedSlots]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider m-0">
            Seçilen Dersler ({selectedCourses.length})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {summary.conflictCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              {summary.conflictCount} Çakışma Var!
            </span>
          )}

          {selectedCourses.length > 0 && (
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {summary.totalWeeklyHours} Saat / Hafta
            </span>
          )}
        </div>
      </div>

      {/* Empty State */}
      {selectedCourses.length === 0 ? (
        <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-500">
            <Sparkles className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 m-0">
            Henüz programa ders eklemediniz
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0 max-w-xs">
            Yukarıdaki <strong>"Zorunlu Dersleri Getir"</strong> butonuna tıklayarak dönem derslerinizi tek tıkla yükleyebilir veya ders arama kutusundan ekleme yapabilirsiniz.
          </p>
        </div>
      ) : (
        /* Course Cards List */
        <div className="flex flex-col gap-2.5 max-h-[580px] overflow-y-auto pr-1">
          {selectedCourses.map((item) => {
            const { course, section } = item;
            const conflicts = getCourseConflicts(item);
            const colorClass = getCourseColor(course.code);

            // Criteria eligibility evaluation for the selected section
            const criteriaEval =
              section && (studentSurname || studentDepartment)
                ? evaluateSectionEligibility(section, studentSurname, studentDepartment)
                : null;

            return (
              <div
                key={course.code}
                onMouseEnter={() => onHoverCourse && onHoverCourse([item])}
                onMouseLeave={() => onHoverCourse && onHoverCourse(null)}
                className={`p-3 rounded-xl border transition-all ${
                  conflicts.length > 0
                    ? 'border-red-300 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                {/* Course Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-xs shadow-xs">
                      {course.codeStr}
                    </span>
                    <span
                      className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate"
                      title={course.name}
                    >
                      {course.name}
                    </span>
                  </div>

                  <button
                    onClick={() => onRemoveCourse(course.code)}
                    type="button"
                    className="shrink-0 p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title={`${course.codeStr} dersini programdan kaldır`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Section Selector */}
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                      Section:
                    </span>
                    <select
                      value={section ? section.sectionNumber : ''}
                      onChange={(e) => {
                        const newSecNum = Number(e.target.value);
                        const matchSec = course.sections.find(
                          (s) => s.sectionNumber === newSecNum
                        );
                        onChangeCourseSection(course.code, matchSec || null);
                      }}
                      className="flex-1 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      {course.sections.map((s) => {
                        const sEval =
                          studentSurname || studentDepartment
                            ? evaluateSectionEligibility(s, studentSurname, studentDepartment)
                            : null;
                        const sCrit =
                          checkSurname && sEval
                            ? sEval.eligible
                              ? ' [✓ Uygun]'
                              : ' [⚠️ Kriter Dışı]'
                            : '';
                        const schedText = s.hasSchedule ? '' : ' (Saat Belirtilmemiş)';
                        return (
                          <option
                            key={s.sectionNumber}
                            value={s.sectionNumber}
                            className="dark:bg-slate-900"
                          >
                            Sec {s.sectionNumber} - {s.instructor || 'STAFF'}
                            {sCrit}
                            {schedText}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Section Information & Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {/* Instructor */}
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      <User className="w-3 h-3 text-slate-400" />
                      {section?.instructor || 'STAFF'}
                    </span>

                    {/* Criteria Status */}
                    {checkSurname && criteriaEval && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                          criteriaEval.eligible
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200'
                        }`}
                        title={criteriaEval.reason}
                      >
                        {criteriaEval.eligible ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Kriter Uygun
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Kriter Dışı
                          </>
                        )}
                      </span>
                    )}

                    {/* Conflict Badges */}
                    {conflicts.map((conf, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {conf.text}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
