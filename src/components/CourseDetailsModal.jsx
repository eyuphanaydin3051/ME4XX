// src/components/CourseDetailsModal.jsx
import React from 'react';
import {
  X,
  BookOpen,
  User,
  Clock,
  Building,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Check,
  Plus,
} from 'lucide-react';
import { evaluateSectionEligibility } from '../utils/surname';
import { getCoursePrerequisite } from '../utils/prerequisites';
import { getRegistrationInfo } from '../utils/registration';

export default function CourseDetailsModal({
  isOpen,
  onClose,
  course,
  currentSection,
  studentDepartment = 'ME',
  studentSurname = '',
  checkSurname = true,
  checkDepartment = true,
  onSelectSection,
  onAddCourse,
  isCourseSelected = false,
}) {
  const [copiedCode, setCopiedCode] = React.useState(false);

  if (!isOpen || !course) return null;

  const handleCopy = (code) => {
    navigator.clipboard.writeText(String(code));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const prereq = getCoursePrerequisite(course.courseNumber);
  const regInfo = getRegistrationInfo(course.courseNumber);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-extrabold text-sm shadow-xs">
                {course.codeStr}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(course.code)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-mono hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                title="SIS Ders Kodunu Kopyala"
              >
                {course.code}
                {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              </button>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                {course.department} Bölümü
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white m-0">
              {course.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Course Summary Pills */}
        <div className="px-6 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs">
          {course.credit !== undefined && (
            <span className="text-slate-600 dark:text-slate-300">
              <strong>Kredi:</strong> {course.credit} ODTÜ
            </span>
          )}
          {course.ects !== undefined && (
            <span className="text-slate-600 dark:text-slate-300">
              <strong>AKTS:</strong> {course.ects}
            </span>
          )}
          <span className="text-slate-600 dark:text-slate-300">
            <strong>Şube Sayısı:</strong> {course.sections?.length || 0}
          </span>
          {prereq && (
            <span className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 text-[11px]">
              <strong>Ön Koşul:</strong> {prereq}
            </span>
          )}
        </div>

        {/* Content: Sections & Criteria Breakdown */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider m-0">
              Tüm Şubeler & Kriter Detayları ({course.sections?.length || 0})
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Aktif Profil: <strong>{studentDepartment}</strong> &bull; Soyad:{' '}
              <strong>{studentSurname || '(Girilmedi)'}</strong>
            </span>
          </div>

          <div className="space-y-3">
            {course.sections?.map((sec) => {
              const isCurrent = currentSection?.sectionNumber === sec.sectionNumber;
              const eligibility = evaluateSectionEligibility(
                sec,
                studentDepartment,
                studentSurname,
                { checkDept: checkDepartment, checkSurname }
              );

              return (
                <div
                  key={sec.sectionNumber}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 ring-1 ring-indigo-500/50'
                      : eligibility.eligible
                      ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                      : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 opacity-80'
                  }`}
                >
                  {/* Section Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200">
                        Section {sec.sectionNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {sec.instructor || 'STAFF'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Eligibility Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${eligibility.badgeClass} flex items-center gap-1`}
                        title={eligibility.details}
                      >
                        {eligibility.eligible ? (
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                        )}
                        {eligibility.badgeLabel}
                      </span>

                      {/* Select / Switch Button */}
                      {isCurrent ? (
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-bold shadow-xs">
                          Seçili Şube
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (isCourseSelected && onSelectSection) {
                              onSelectSection(course.code, sec);
                            } else if (onAddCourse) {
                              onAddCourse(course, sec);
                            }
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold transition-all cursor-pointer"
                        >
                          {isCourseSelected ? 'Bu Şubeye Geç' : '+ Şubeyi Ekle'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lecture Schedule Times */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Ders Saatleri:
                    </span>
                    {sec.schedule && sec.schedule.length > 0 ? (
                      sec.schedule.map((b, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {b.dayEn}: {b.slots?.join(', ')} ({b.classroom || b.building || 'TBA'})
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Haftalık takvimde ders saati yok (Saatsiz/Online/Staj)
                      </span>
                    )}
                  </div>

                  {/* Criteria Breakdown */}
                  {sec.criteria && sec.criteria.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                        Kayıt Kriterleri (ODTÜ SIS):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sec.criteria.map((c, cIdx) => (
                          <span
                            key={cIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300"
                          >
                            <strong>{c.given_dept || 'ALL'}</strong> &bull; Soyad:{' '}
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {c.start_char || 'AA'} - {c.end_char || 'ZZ'}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/50">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Resmi ODTÜ SIS ders ve şube verileri
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
