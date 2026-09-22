// src/components/BlockedHoursManager.jsx
import React from 'react';
import { Lock, Unlock, Sun, Coffee, CalendarOff, AlertCircle } from 'lucide-react';
import { DAYS, TIME_SLOTS, getSlotKey } from '../utils/timeSlots';

export default function BlockedHoursManager({
  blockedSlots = new Set(),
  onUpdateBlockedSlots,
}) {
  const blockedCount = blockedSlots.size;

  // Preset 1: Block all 08:40 morning slots (Index 0 for all days)
  const blockAll840s = () => {
    const next = new Set(blockedSlots);
    DAYS.forEach((d) => next.add(getSlotKey(d.id, 0)));
    onUpdateBlockedSlots(next);
  };

  // Preset 2: Block entire Friday (Slots 0 to 8 for Friday)
  const blockFriday = () => {
    const next = new Set(blockedSlots);
    TIME_SLOTS.forEach((s) => next.add(getSlotKey('Friday', s.index)));
    onUpdateBlockedSlots(next);
  };

  // Preset 3: Block Monday Morning (08:40 to 12:30 -> slots 0, 1, 2, 3)
  const blockMondayMorning = () => {
    const next = new Set(blockedSlots);
    [0, 1, 2, 3].forEach((s) => next.add(getSlotKey('Monday', s)));
    onUpdateBlockedSlots(next);
  };

  // Preset 4: Protect lunch break (12:40 to 13:30 -> slot 4 for all days)
  const blockLunchBreak = () => {
    const next = new Set(blockedSlots);
    DAYS.forEach((d) => next.add(getSlotKey(d.id, 4)));
    onUpdateBlockedSlots(next);
  };

  // Preset 5: Clear all blocked slots
  const clearAllBlocks = () => {
    onUpdateBlockedSlots(new Set());
  };

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs dark:shadow-lg transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 m-0">
              Bloklu Saatler (Ders İstemediğiniz Zamanlar)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
              {blockedCount > 0 ? (
                <span className="text-rose-600 dark:text-rose-400 font-medium">
                  {blockedCount} saat bloklandı
                </span>
              ) : (
                'Henüz saat bloklanmadı. Hızlı butonları veya takvimdeki kutucukları kullanın.'
              )}
            </p>
          </div>
        </div>

        {blockedCount > 0 && (
          <button
            onClick={clearAllBlocks}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-500/30 transition-all"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Tüm Blokları Kaldır</span>
          </button>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={blockAll840s}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
        >
          <Sun className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Sabah 08:40'ları Kapat</span>
        </button>

        <button
          onClick={blockFriday}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
        >
          <CalendarOff className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span>Cuma Gününü Boşalt</span>
        </button>

        <button
          onClick={blockLunchBreak}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
        >
          <Coffee className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Öğle Arasını Koru (12:40)</span>
        </button>

        <button
          onClick={blockMondayMorning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
        >
          <Sun className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          <span>Pazartesi Sabahını Kapat</span>
        </button>
      </div>
    </div>
  );
}
