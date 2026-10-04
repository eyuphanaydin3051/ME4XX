// src/components/UnscheduledCoursesCard.jsx
import React from 'react';
import { Info, ExternalLink, Check, Plus, AlertCircle, Bookmark } from 'lucide-react';

export default function UnscheduledCoursesCard({
  unscheduledMusts = [],
  selectedCourses = [],
  onAddCourse,
}) {
  if (!unscheduledMusts || unscheduledMusts.length === 0) {
    return null;
  }

  const selectedCodeSet = new Set(selectedCourses.map((s) => s.course.code));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-2.5 transition-colors">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Info className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 m-0">
              Kredisiz / Saatsiz Zorunlu Dersler ({unscheduledMusts.length})
            </h4>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Müfredatta zorunludur, ancak haftalık takvimde ders saati yoktur
            </span>
          </div>
        </div>

        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          Takvim Dışı
        </span>
      </div>

      <p className="text-[11px] text-slate-600 dark:text-slate-400 m-0 leading-relaxed">
        Aşağıdaki dersler (staj, İSG, temel teknolojiler vb.) haftalık takvimde ders saati kaplamadığı için programa otomatik eklenmemiştir. ODTÜ SIS kayıt döneminde seçilmelidir:
      </p>

      <div className="flex flex-col gap-1.5 pt-1">
        {unscheduledMusts.map((item) => {
          const { mustMeta, course, isAvailableInCatalog } = item;
          const isSelected = course ? selectedCodeSet.has(course.code) : false;

          return (
            <div
              key={mustMeta.code}
              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 font-bold text-[11px] text-slate-800 dark:text-slate-200">
                  {mustMeta.abbr}
                </span>
                <span
                  className="font-medium text-slate-700 dark:text-slate-300 truncate text-[11px]"
                  title={mustMeta.name}
                >
                  {mustMeta.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  {mustMeta.credit === 0 ? '0 Kredi' : 'Saatsiz'}
                </span>

                {course && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSelected) {
                        const sec = course.sections[0] || null;
                        onAddCourse(course, sec);
                      }
                    }}
                    disabled={isSelected}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 cursor-default'
                        : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    }`}
                    title={
                      isSelected
                        ? 'Listenize zaten ekli'
                        : 'Bu saatsiz dersi kayıt listenizde takip etmek için ekleyin'
                    }
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Ekli</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>Takip İçin Ekle</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
