// src/components/Timetable.jsx
import React, { useState } from 'react';
import { DAYS, TIME_SLOTS, getSlotKey } from '../utils/timeSlots';
import { getCourseColor } from '../utils/colors';
import {
  Lock,
  AlertTriangle,
  Sparkles,
  Building,
  User,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import { getCoursePrerequisite } from '../utils/prerequisites';
import { getRegistrationInfo, REG_TYPE_CONFIG } from '../utils/registration';

export default function Timetable({
  scheduledItems = [], // [{ course, section, isElective?: boolean }]
  blockedSlots = new Set(), // Set of 'Day-Slot'
  onToggleBlockSlot,
  previewItems = null, // [{ course, section }] for hover preview
  timetableRef,
  onOpenExport,
}) {
  const [isCompact, setIsCompact] = useState(true);
  const [copiedCourseCode, setCopiedCourseCode] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const handleCopyCourseCode = (e, course, section) => {
    e.stopPropagation();
    const sisCode =
      course.code ||
      `5690${String(course.courseNumber).padStart(3, '0')}`;
    navigator.clipboard.writeText(sisCode);
    setCopiedCourseCode(course.code || sisCode);
    setToastMessage(`Kopyalandı: ${sisCode} (${course.codeStr} - Section ${section?.sectionNumber || 1})`);

    setTimeout(() => {
      setCopiedCourseCode((prev) => (prev === (course.code || sisCode) ? null : prev));
    }, 1800);

    setTimeout(() => {
      setToastMessage((prev) => (prev?.includes(sisCode) ? null : prev));
    }, 2800);
  };
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
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/50">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider m-0">
            Haftalık Ders Takvimi
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            (Dersler 50 dk • 08:40 - 17:30)
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
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

          {/* Görünüm Yoğunluğu Seçici (Kompakt / Geniş) */}
          <div className="flex items-center bg-slate-200 dark:bg-slate-800 rounded-xl p-0.5 text-[11px] font-medium">
            <button
              onClick={() => setIsCompact(true)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                isCompact
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Tüm saatleri tek ekranda görebilmek için kompakt satır yüksekliği"
            >
              Kompakt (Tek Ekran)
            </button>
            <button
              onClick={() => setIsCompact(false)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                !isCompact
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Daha geniş satır ve kart yüksekliği"
            >
              Geniş
            </button>
          </div>

          {/* Takvimi Dışa Aktar Butonu */}
          {onOpenExport && (
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all transform hover:scale-[1.02] ml-1 sm:ml-2"
              title="Haftalık ders takvimini görsel (PNG), PDF veya metin olarak dışa aktar"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Takvimi Dışa Aktar</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto" ref={timetableRef}>
        <table className="w-full border-collapse table-fixed select-none text-left min-w-[620px] md:min-w-full">
          <colgroup>
            <col style={{ width: '68px', minWidth: '68px', maxWidth: '68px' }} />
            {DAYS.map((day) => (
              <col key={day.id} style={{ width: 'calc((100% - 68px) / 5)' }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <th
                style={{ width: '68px', minWidth: '68px', maxWidth: '68px' }}
                className={`w-[68px] min-w-[68px] max-w-[68px] ${isCompact ? 'py-1 px-1' : 'p-2'} text-center border-r border-slate-200 dark:border-slate-800/80 text-[11px] font-semibold text-slate-700 dark:text-slate-300`}
              >
                Saat
              </th>
              {DAYS.map((day) => (
                <th
                  key={day.id}
                  style={{ width: 'calc((100% - 68px) / 5)' }}
                  className={`${isCompact ? 'py-1 px-1.5' : 'p-2.5'} text-center border-r last:border-r-0 border-slate-200 dark:border-slate-800/80 font-medium max-w-0`}
                >
                  <div className="text-slate-900 dark:text-slate-100 font-semibold text-xs truncate">{day.label}</div>
                  <div className={`${isCompact ? 'text-[9.5px]' : 'text-[10.5px]'} text-slate-500 font-normal leading-none mt-0.5`}>
                    {day.shortLabel}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs">
            {TIME_SLOTS.map((slot) => (
              <tr key={slot.index} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                {/* Time Label Column (Kompakt Sol Sütun) */}
                <td
                  style={{ width: '68px', minWidth: '68px', maxWidth: '68px' }}
                  className={`w-[68px] min-w-[68px] max-w-[68px] ${isCompact ? 'py-1 px-0.5' : 'p-1.5'} text-center bg-slate-50/80 dark:bg-slate-950/40 border-r border-slate-200 dark:border-slate-800/80 align-middle`}
                >
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-[11px] leading-tight">{slot.start}</div>
                  <div className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} text-slate-500 dark:text-slate-400 leading-tight`}>{slot.end}</div>
                  <div className={`${isCompact ? 'text-[8px]' : 'text-[8.5px]'} text-slate-400 dark:text-slate-500 font-mono mt-0.5 leading-none`}>
                    {slot.period.replace(' (Öğle)', '')}
                  </div>
                </td>

                {/* Day Columns (5 Gün Eşit Genişlikte) */}
                {DAYS.map((day) => {
                  const cellKey = getSlotKey(day.id, slot.index);
                  const isBlocked = blockedSlots.has(cellKey);
                  const occupants = cellOccupants[cellKey] || [];
                  const previews = previewOccupants[cellKey] || [];
                  const hasConflict = occupants.length > 1 || (occupants.length > 0 && isBlocked);

                  return (
                    <td
                      key={cellKey}
                      style={{ width: 'calc((100% - 68px) / 5)' }}
                      onClick={() => {
                        // Toggle block only if no course is currently scheduled
                        if (occupants.length === 0) {
                          onToggleBlockSlot(cellKey);
                        }
                      }}
                      className={`${isCompact ? 'p-1' : 'p-1.5'} border-r last:border-r-0 border-slate-200 dark:border-slate-800/60 relative align-top transition-all max-w-0 overflow-hidden ${
                        isCompact ? 'h-[50px]' : 'min-h-[78px]'
                      } ${
                        isBlocked
                          ? 'bg-rose-50/90 dark:bg-rose-950/40 cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/50 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:8px_8px]'
                          : occupants.length === 0
                          ? 'cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                          : 'bg-white dark:bg-slate-900/60'
                      }`}
                    >
                      {/* Blocked Slot Indicator */}
                      {isBlocked && occupants.length === 0 && (
                        <div className={`h-full w-full ${isCompact ? 'py-1 flex-row gap-1' : 'py-4 flex-col gap-0.5'} rounded flex items-center justify-center text-rose-600 dark:text-rose-400/80 pointer-events-none`}>
                          <Lock className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-rose-600 dark:text-rose-400/90`} />
                          <span className={`${isCompact ? 'text-[9.5px]' : 'text-[10px]'} font-medium tracking-tight`}>
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
                        const isMust4xx = occ.course.courseNumber === '407' || occ.course.courseNumber === '410';
                        const prereq = getCoursePrerequisite(occ.course.codeStr);
                        const regInfo = getRegistrationInfo(occ.course.codeStr);
                        const regCfg = regInfo ? REG_TYPE_CONFIG[regInfo.type] : null;

                        const sisCode =
                          occ.course.code ||
                          `5690${String(occ.course.courseNumber).padStart(3, '0')}`;
                        const isCopied = copiedCourseCode === occ.course.code || copiedCourseCode === sisCode;
                        const isInteractive = !regInfo || regInfo.type === 'interactive';

                        return (
                          <div
                            key={idx}
                            onClick={(e) => handleCopyCourseCode(e, occ.course, occ.section)}
                            className={`${isCompact ? 'p-1 rounded-md' : 'p-1.5 rounded-lg'} border shadow-xs transition-transform hover:scale-[1.01] cursor-pointer group w-full min-w-0 overflow-hidden relative ${style.bg} ${style.border} ${style.text}`}
                            title={`${occ.course.codeStr} - ${occ.course.name}\nSection: ${
                              occ.section.sectionNumber
                            }\nDerslik: ${occ.blockClassroom || 'ME'} (${
                              occ.blockBuilding || ''
                            })\nÖğretim Üyesi: ${
                              occ.section.instructors?.map((i) => i.name).join(', ') || 'Belirtilmedi'
                            }${prereq ? `\nÖn Şart: ${prereq}` : ''}${
                              regInfo ? `\nKayıt Yöntemi: ${regCfg?.label}` : '\nKayıt Yöntemi: İnteraktif Kayıt'
                            }\n\n📋 Tıkla: 7 haneli ODTÜ kodunu (${sisCode}) panoya kopyalar!`}
                          >
                            {/* Copied Flash Overlay */}
                            {isCopied && (
                              <div className={`absolute inset-0 bg-emerald-600/95 text-white flex ${isCompact ? 'items-center justify-center gap-1 p-0.5' : 'flex-col items-center justify-center p-1'} rounded-md z-30 animate-in fade-in zoom-in-95 duration-150`}>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span className="font-mono font-bold text-[10px]">{sisCode}</span>
                                <span className="text-[9px] opacity-90 font-medium">{isCompact ? 'Kopyalandı' : 'Panoya Kopyalandı!'}</span>
                              </div>
                            )}

                            {/* Line 1: Course Code and Section */}
                            <div className="flex items-center justify-between gap-1 leading-none min-w-0 w-full">
                              <span className="font-bold tracking-tight text-[11px] truncate min-w-0 flex items-center gap-0.5">
                                <span>{occ.course.codeStr}</span>
                                <Copy className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 shrink-0 transition-opacity" />
                              </span>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <span
                                  className={`text-[9px] px-1 py-0.2 rounded font-semibold shrink-0 ${
                                    isMust4xx
                                      ? 'bg-blue-400/40 text-blue-100 border border-blue-300/50'
                                      : isElective
                                      ? 'bg-amber-400/30 text-amber-100 border border-amber-300/40'
                                      : 'bg-white/20 text-white'
                                  }`}
                                >
                                  {isCompact ? `S${occ.section.sectionNumber}` : `Sec ${occ.section.sectionNumber}`}
                                </span>
                                {isMust4xx ? (
                                  <span className="text-[8px] px-1 rounded bg-blue-900/60 text-blue-200 border border-blue-400/30 font-medium shrink-0">
                                    Zorunlu
                                  </span>
                                ) : isElective ? (
                                  <span className="text-[8.5px] px-0.5 rounded bg-amber-400/20 text-amber-200 font-medium shrink-0">
                                    ME4
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            {/* Line 2: Classroom & Instructor */}
                            <div className={`${isCompact ? 'mt-0.5' : 'mt-1'} flex items-center justify-between text-[9.5px] opacity-90 gap-1 min-w-0 w-full leading-none`}>
                              <span className="truncate min-w-0 flex items-center gap-0.5">
                                <Building className="w-2 h-2 inline shrink-0 opacity-80" />
                                <span className="truncate min-w-0">{occ.blockClassroom || 'ME'}</span>
                              </span>
                              {occ.section.instructors?.length > 0 && (
                                <span className="truncate min-w-0 flex items-center gap-0.5 text-[9px] opacity-95">
                                  <User className="w-2 h-2 inline shrink-0 opacity-80" />
                                  <span className="truncate min-w-0">
                                    {isCompact
                                      ? occ.section.instructors.map((i) => i.name.split(' ').pop()).join(', ')
                                      : occ.section.instructors.map((i) => i.name).join(', ')}
                                  </span>
                                </span>
                              )}
                            </div>

                            {/* Line 3: Prerequisites & Registration (SIS Code or Form) */}
                            <div className={`${isCompact ? 'mt-0.5 pt-0.5' : 'mt-1 pt-1'} border-t border-white/20 flex items-center justify-between gap-1 text-[8.5px] min-w-0 w-full leading-none`}>
                              {prereq ? (
                                <span
                                  className="truncate min-w-0 text-amber-200 font-medium text-[8px] flex items-center gap-0.5"
                                  title={`Ön Şart: ${prereq}`}
                                >
                                  <CheckCircle className="w-2 h-2 inline shrink-0 text-amber-300" />
                                  <span className="truncate">Ön: {prereq.replace('ME ', '')}</span>
                                </span>
                              ) : (
                                <span />
                              )}

                              <div className="flex items-center gap-0.5 shrink-0 ml-auto">
                                <span
                                  className={`px-1 py-0.2 rounded font-mono text-[8.5px] flex items-center gap-0.5 font-semibold ${
                                    regCfg?.badgeClass || 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                                  }`}
                                  title={`${occ.course.codeStr} ODTÜ Kodu: ${sisCode}`}
                                >
                                  {sisCode}
                                </span>
                                {regInfo?.formUrl && (
                                  <a
                                    href={regInfo.formUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-white hover:text-amber-200 underline font-medium p-0.5"
                                    title={`${occ.course.codeStr} Kayıt Formunu Aç`}
                                  >
                                    <ExternalLink className="w-2.5 h-2.5 inline" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Preview Occupant Cards (Dashed Outline) */}
                      {previews.length > 0 && occupants.length === 0 && (
                        <div className={`${isCompact ? 'p-1 rounded-md' : 'p-1.5 rounded-lg'} border-2 border-dashed border-indigo-400/80 bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 animate-pulse w-full min-w-0 overflow-hidden`}>
                          <div className="flex items-center justify-between gap-1 leading-none min-w-0 w-full">
                            <span className="font-bold text-[11px] truncate min-w-0">
                              {previews[0].course.codeStr}
                            </span>
                            <span className="text-[9px] px-1 bg-indigo-400/30 rounded font-semibold shrink-0">
                              S{previews[0].section.sectionNumber}
                            </span>
                          </div>
                          <div className={`${isCompact ? 'mt-0.5' : 'mt-1'} text-[9px] text-indigo-600 dark:text-indigo-300 flex items-center gap-0.5 truncate min-w-0 leading-none`}>
                            <Sparkles className="w-2.5 h-2.5 inline shrink-0" /> <span className="truncate min-w-0">Önizleme</span>
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
            Ders kartına tıklayarak <strong>7 haneli interaktif kayıt kodunu ({'5690xxx'})</strong> kopyalayabilirsiniz. Boş kutucuklara tıklayarak o saati kapatıp açabilirsiniz.
          </span>
        </div>
        <div className="text-slate-500">
          Toplam Ders Saati:{' '}
          <span className="text-slate-900 dark:text-slate-200 font-semibold">
            {Object.keys(cellOccupants).length} saat/hafta
          </span>
        </div>
      </div>

      {/* Toast Notification for Copied Code */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700 dark:border-slate-300 animate-in fade-in slide-in-from-bottom-4 duration-200 pointer-events-none">
          <CheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <span className="text-[10px] opacity-75 font-normal ml-1 border-l border-white/20 dark:border-slate-700 pl-2 hidden sm:inline">
            register.metu.edu.tr sistemine yapıştırabilirsiniz
          </span>
        </div>
      )}
    </div>
  );
}
