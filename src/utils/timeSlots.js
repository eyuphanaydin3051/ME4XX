// src/utils/timeSlots.js

export const DAYS = [
  { id: 'Monday', label: 'Pazartesi', shortLabel: 'Pzt' },
  { id: 'Tuesday', label: 'Salı', shortLabel: 'Sal' },
  { id: 'Wednesday', label: 'Çarşamba', shortLabel: 'Çar' },
  { id: 'Thursday', label: 'Perşembe', shortLabel: 'Per' },
  { id: 'Friday', label: 'Cuma', shortLabel: 'Cum' },
];

export const TIME_SLOTS = [
  { index: 0, start: '08:40', end: '09:30', label: '08:40 - 09:30', period: '1. Ders' },
  { index: 1, start: '09:40', end: '10:30', label: '09:40 - 10:30', period: '2. Ders' },
  { index: 2, start: '10:40', end: '11:30', label: '10:40 - 11:30', period: '3. Ders' },
  { index: 3, start: '11:40', end: '12:30', label: '11:40 - 12:30', period: '4. Ders' },
  { index: 4, start: '12:40', end: '13:30', label: '12:40 - 13:30', period: '5. Ders (Öğle)' },
  { index: 5, start: '13:40', end: '14:30', label: '13:40 - 14:30', period: '6. Ders' },
  { index: 6, start: '14:40', end: '15:30', label: '14:40 - 15:30', period: '7. Ders' },
  { index: 7, start: '15:40', end: '16:30', label: '15:40 - 16:30', period: '8. Ders' },
  { index: 8, start: '16:40', end: '17:30', label: '16:40 - 17:30', period: '9. Ders' },
];

export const START_HOURS = {
  '08:40': 0,
  '09:40': 1,
  '10:40': 2,
  '11:40': 3,
  '12:40': 4,
  '13:40': 5,
  '14:40': 6,
  '15:40': 7,
  '16:40': 8,
};

export const END_HOURS = {
  '09:30': 0,
  '10:30': 1,
  '11:30': 2,
  '12:30': 3,
  '13:30': 4,
  '14:30': 5,
  '15:30': 6,
  '16:30': 7,
  '17:30': 8,
};

/**
 * Creates a unique cell key e.g. "Monday-0"
 */
export function getSlotKey(day, slotIndex) {
  return `${day}-${slotIndex}`;
}

/**
 * Checks if a section's schedule conflicts with a set of blocked slots
 * @param {Array} schedule 
 * @param {Set<string>} blockedSlotsSet 
 * @returns {boolean}
 */
export function sectionConflictsWithBlocked(schedule, blockedSlotsSet) {
  if (!schedule || !blockedSlotsSet || blockedSlotsSet.size === 0) return false;
  for (const block of schedule) {
    for (const slot of block.slots || []) {
      if (blockedSlotsSet.has(getSlotKey(block.dayEn, slot))) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Checks if two section schedules have time clashes
 * @param {Array} scheduleA 
 * @param {Array} scheduleB 
 * @returns {boolean}
 */
export function schedulesConflict(scheduleA, scheduleB) {
  if (!scheduleA || !scheduleB) return false;
  for (const a of scheduleA) {
    for (const b of scheduleB) {
      if (a.dayEn === b.dayEn) {
        for (const slotA of a.slots || []) {
          if ((b.slots || []).includes(slotA)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

/**
 * Returns an array of occupied slot keys for a schedule
 * @param {Array} schedule 
 * @returns {string[]}
 */
export function getScheduleOccupiedKeys(schedule) {
  const keys = [];
  for (const block of schedule || []) {
    for (const slot of block.slots || []) {
      keys.push(getSlotKey(block.dayEn, slot));
    }
  }
  return keys;
}
