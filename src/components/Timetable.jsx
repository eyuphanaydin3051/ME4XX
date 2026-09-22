// src/components/Timetable.jsx
import React from 'react';
import { DAYS, TIME_SLOTS, getSlotKey } from '../utils/timeSlots';
import { getCourseColor } from '../utils/colors';
import { Lock, AlertTriangle, Sparkles, Building, User } from 'lucide-react';

export default function Timetable({
  scheduledItems = [], // [{ course, section, isElective?: boolean }]
  blockedSlots = new Set(), // Set of 'Day-Slot'
  onToggleBlockSlot,
  previewItems = null, // [{ course, section }] for hover preview
  timetableRef,
}) {
  // Construct lookup maps for fast cell rendering:
  // cellOccupants[key] = array of { course, section, isElective }
  const cellOccupants = {};
  // previewOccupants[key] = array of { course, section }
  const previewOccupants = {};

  for (const item of scheduledItems) {
    if (!item.section) continue;
    for (const block of item.section.schedule || []) {
      for (const slot of block.slots || []) {
        const key = getSlotKey(block.dayEn, slot);
        if (!cellOccupants[key]) cellOccupants[key] = [];
        cellOccupants[key].push({
          ...item,
          blockClassroom: block.classroom,
          blockBuilding: block.building,
        });
      }
    }
  }

  if (previewItems) {
    for (const item of previewItems) {
      if (!item.section) continue;
      for (const block of item.section.schedule || []) {
        for (const slot of block.slots || []) {
          const key = getSlotKey(block.dayEn, slot);
          if (!previewOccupants[key]) previewOccupants[key] = [];
          previewOccupants[key].push({
            ...item,
            blockClassroom: block.classroom,
            blockBuilding: block.building,
          });
        }
      }
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col transition-colors">
      {/* Timetable Header / Toolbar */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider m-0">
            Haftalık Ders Takvimi
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            (Dersler 50 dk • 08:40 - 17:30)
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-500/20 dark:bg-indigo-500/30 border border-indigo-400/60 inline-block"></span>
            <span>Sabit Dersler</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/20 dark:bg-amber-500/30 border border-amber-400/60 inline-block"></span>
            <span>ME4 Seçmeli</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800/80 inline-block bg-[radial-gradient(#ef4444_1px,transparent_1px)] [background-size:6px_6px]"></span>
            <span>Bloklu Saat</span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto" ref={timetableRef}>
        <table className="w-full border-collapse min-w-[700px] select-none text-left">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <th className="p-3 w-28 text-center border-r border-slate-200 dark:border-slate-800/80">
                Saat / Slot
              </th>
              {DAYS.map((day) => (
                <th
                  key={day.id}
                  className="p-3 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-800/80 font-medium"
                >
                  <div className="text-slate-900 dark:text-slate-100 font-semibold">{day.label}</div>
                  <div className="text-[11px] text-slate-500 font-normal">
                    {day.shortLabel}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
            {TIME_SLOTS.map((slot) => (
              <tr key={slot.index} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                {/* Time Label Column */}
                <td className="p-2.5 text-center bg-slate-50/80 dark:bg-slate-950/40 border-r border-slate-200 dark:border-slate-800/80">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{slot.start}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{slot.end}</div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                    {slot.period}
                  </div>
                </td>

                {/* Day Columns */}
                {DAYS.map((day) => {
                  const cellKey = getSlotKey(day.id, slot.index);
                  const isBlocked = blockedSlots.has(cellKey);
                  const occupants = cellOccupants[cellKey] || [];
                  const previews = previewOccupants[cellKey] || [];
                  const hasConflict = occupants.length > 1 || (occupants.length > 0 && isBlocked);

                  return (
                    <td
                      key={cellKey}
                      onClick={() => {
                        // Toggle block only if no course is currently scheduled
                        if (occupants.length === 0) {
                          onToggleBlockSlot(cellKey);
                        }
                      }}
                      className={`p-1.5 border-r last:border-r-0 border-slate-200 dark:border-slate-800/60 relative h-16 align-top transition-all ${
                        isBlocked
                          ? 'bg-rose-50/90 dark:bg-rose-950/40 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/50 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:8px_8px]'
                          : occupants.length === 0
                          ? 'cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                          : 'bg-white dark:bg-slate-900/60'
                      }`}
                    >
                      {/* Blocked Slot Indicator */}
                      {isBlocked && occupants.length === 0 && (
                        <div className="h-full w-full rounded flex flex-col items-center justify-center text-rose-600 dark:text-rose-400/80 gap-0.5 pointer-events-none">
                          <Lock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400/90" />
                          <span className="text-[10px] font-medium tracking-tight">
                            Kapalı
                          </span>
                        </div>
                      )}

                      {/* Conflict Badge */}
                      {hasConflict && (
                        <div className="absolute top-1 right-1 z-20 flex items-center gap-0.5 px-1 py-0.5 rounded bg-rose-500 text-white text-[9px] font-bold shadow-md animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Çakışma</span>
                        </div>
                      )}

                      {/* Occupant Course Cards */}
                      {occupants.map((occ, idx) => {
                        const style = getCourseColor(occ.course.code);
                        const isElective = occ.isElective || occ.course.isME4;

                        return (
                          <div
                            key={idx}
                            className={`p-1.5 rounded-lg border shadow-xs transition-transform hover:scale-[1.02] cursor-pointer group ${style.bg} ${style.border} ${style.text}`}
                            title={`${occ.course.codeStr} - ${occ.course.name}\nSection: ${
                              occ.section.sectionNumber
                            }\nDerslik: ${occ.blockClassroom || 'ME'} (${
                              occ.blockBuilding || ''
                            })\nÖğretim Üyesi: ${
                              occ.section.instructors?.map((i) => i.name).join(', ') || 'Belirtilmedi'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 leading-none">
                              <span className="font-bold tracking-tight text-[11px]">
                                {occ.course.codeStr}
                              </span>
                              <span
                                className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                                  isElective
                                    ? 'bg-amber-400/30 text-amber-100 border border-amber-300/40'
                                    : 'bg-white/20 text-white'
                                }`}
                              >
                                Sec {occ.section.sectionNumber}
                              </span>
                            </div>

                            <div className="mt-1 flex items-center justify-between text-[10px] opacity-90 truncate">
                              <span className="truncate flex items-center gap-0.5">
                                <Building className="w-2.5 h-2.5 inline shrink-0" />
                                {occ.blockClassroom || 'ME'}
                              </span>
                              {isElective && (
                                <span className="text-[9px] text-amber-200 font-medium">
                                  ME4
                                </span>
                              )}
                            </div>

                            {occ.section.instructors?.length > 0 && (
                              <div className="text-[9.5px] opacity-90 truncate mt-0.5 flex items-center gap-0.5 font-medium">
                                <User className="w-2.5 h-2.5 inline shrink-0" />
                                <span className="truncate">{occ.section.instructors.map(i => i.name).join(', ')}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Preview Occupant Cards (Dashed Outline) */}
                      {previews.length > 0 && occupants.length === 0 && (
                        <div className="p-1.5 rounded-lg border-2 border-dashed border-indigo-400/80 bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 animate-pulse">
                          <div className="flex items-center justify-between gap-1 leading-none">
                            <span className="font-bold text-[11px]">
                              {previews[0].course.codeStr}
                            </span>
                            <span className="text-[9px] px-1 bg-indigo-400/30 rounded font-semibold">
                              Sec {previews[0].section.sectionNumber}
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] text-indigo-600 dark:text-indigo-300 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> Önizleme
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Timetable Footer info */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">İpucu:</span>
          <span>
            Kutucuklara tıklayarak istediğiniz gün ve saati kapatıp açabilirsiniz.
          </span>
        </div>
        <div className="text-slate-500">
          Toplam Ders Saati:{' '}
          <span className="text-slate-900 dark:text-slate-200 font-semibold">
            {Object.keys(cellOccupants).length} saat/hafta
          </span>
        </div>
      </div>
    </div>
  );
}
