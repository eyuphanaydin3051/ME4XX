// src/components/SemesterBar.jsx
import React, { useMemo } from 'react';
import {
  Sparkles,
  User,
  Trash2,
  BookmarkPlus,
  Building2,
  Calendar,
  BookOpen,
  Info,
} from 'lucide-react';
import {
  getAvailableSemesters,
  getDepartmentCurriculum,
  partitionMustCourses,
} from '../utils/curriculum';

export default function SemesterBar({
  allCourses = [],
  studentDepartment = 'ME',
  onOpenDepartmentsModal,
  selectedSemester = 1,
  onChangeSemester,
  studentSurname = '',
  onChangeSurname,
  checkSurname = true,
  onToggleCheckSurname,
  onFetchMustCourses,
  onResetAll,
  onOpenSaveModal,
  selectedCoursesCount = 0,
}) {
  // Available semesters for this department
  const availableSemesters = useMemo(() => {
    return getAvailableSemesters(studentDepartment);
  }, [studentDepartment]);

  // Curriculum info for department
  const deptCurriculum = useMemo(() => {
    return getDepartmentCurriculum(studentDepartment);
  }, [studentDepartment]);

  // Partitioned must courses: Scheduled timetable courses vs. Unscheduled/Non-credit courses (Staj, OHS, etc.)
  const { scheduledMusts, unscheduledMusts } = useMemo(() => {
    return partitionMustCourses(studentDepartment, selectedSemester, allCourses);
  }, [studentDepartment, selectedSemester, allCourses]);

  // Two-letter surname prefix
  const surnamePrefix = useMemo(() => {
    const clean = (studentSurname || '').trim();
    if (!clean) return '';
    return clean.slice(0, 2).toLocaleUpperCase('tr-TR');
  }, [studentSurname]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-all">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Department & Semester Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 1. Department Button */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-indigo-500" />
              Bölüm
            </span>
            <button
              onClick={onOpenDepartmentsModal}
              type="button"
              className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all text-left cursor-pointer"
              title="Okuldaki 156 bölüm arasından seçim yapın"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                {studentDepartment}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  {studentDepartment}
                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 max-w-[140px] truncate hidden sm:inline">
                    {deptCurriculum?.name || 'Mühendislik'}
                  </span>
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  Değiştir ▾
                </span>
              </div>
            </button>
          </div>

          {/* 2. Semester Selector (Dönem Sorgusu) */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-500" />
              Dönem (Semester)
            </span>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <select
                value={selectedSemester}
                onChange={(e) => onChangeSemester(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 px-2.5 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {availableSemesters.map((sem) => (
                  <option key={sem} value={sem} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                    {sem}. Dönem {sem % 2 !== 0 ? '(Güz)' : '(Bahar)'}
                  </option>
                ))}
              </select>

              {/* Scheduled Must Courses Badge */}
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 ${
                  scheduledMusts.length > 0
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
                title={`${selectedSemester}. Dönem için haftalık ders saati olan ${scheduledMusts.length} adet zorunlu ders`}
              >
                <BookOpen className="w-3 h-3" />
                {scheduledMusts.length} Takvim Dersi
              </span>

              {/* Unscheduled / Non-credit Badge */}
              {unscheduledMusts.length > 0 && (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hidden md:inline-flex items-center gap-1"
                  title={`Kredisiz / Saatsiz Dersler: ${unscheduledMusts.map((u) => u.mustMeta.abbr).join(', ')} (Haftalık programa eklenmez)`}
                >
                  +{unscheduledMusts.length} Saatsiz ({unscheduledMusts.map((u) => u.mustMeta.abbr).join(', ')})
                </span>
              )}
            </div>
          </div>

          {/* 3. Surname Input */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-amber-500" />
              Soyad Kriteri
            </span>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                value={studentSurname}
                onChange={(e) => onChangeSurname(e.target.value)}
                placeholder="Örn: AYDIN"
                className="w-24 sm:w-28 bg-transparent text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none uppercase py-1"
                maxLength={25}
              />
              {surnamePrefix ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                  {surnamePrefix}
                </span>
              ) : null}

              <button
                type="button"
                onClick={onToggleCheckSurname}
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  checkSurname
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
                title={checkSurname ? 'Kriter filtresi aktif' : 'Kriter filtresi pasif'}
              >
                {checkSurname ? 'Kriter: Açık' : 'Kapalı'}
              </button>
            </div>
          </div>
        </div>

        {/* Right: "⚡ Zorunlu Dersleri Getir" & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Action: Fetch Must Courses (Only Scheduled Courses) */}
          <button
            type="button"
            onClick={onFetchMustCourses}
            disabled={scheduledMusts.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            title={`${selectedSemester}. Dönem için ders saati olan ${scheduledMusts.length} zorunlu dersi haftalık programa ekler (Saatsiz dersler takvime eklenmez)`}
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Zorunlu Dersleri Getir</span>
            <span className="bg-emerald-700/60 px-1.5 py-0.5 rounded text-[10px]">
              {scheduledMusts.length} Ders
            </span>
          </button>

          {/* Save / Preferences */}
          <button
            type="button"
            onClick={onOpenSaveModal}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold transition-all cursor-pointer"
            title="Seçili dersleri ve programı tarayıcıya kaydet"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kaydet</span>
          </button>

          {/* Reset All */}
          {selectedCoursesCount > 0 && (
            <button
              type="button"
              onClick={onResetAll}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 text-xs font-medium transition-all cursor-pointer"
              title="Tüm seçilen dersleri ve programı sıfırla"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Temizle</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
