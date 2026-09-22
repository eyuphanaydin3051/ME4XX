// src/utils/registration.js
import registrationList from '../data/registration_info.json';

const regMap = new Map();
registrationList.forEach((item) => {
  const cleanKey = item.code.replace(/\s+/g, '').toUpperCase();
  regMap.set(cleanKey, item);
});

/**
 * Returns registration instructions, TA info and form links for a 4xx course
 * @param {string} courseCodeStr - e.g. "ME 402" or "ME402"
 */
export function getRegistrationInfo(courseCodeStr) {
  if (!courseCodeStr) return null;
  const clean = courseCodeStr.replace(/\s+/g, '').toUpperCase();
  return regMap.get(clean) || null;
}

export function getAllRegistrationInfo() {
  return registrationList;
}

export const REG_TYPE_CONFIG = {
  form: {
    label: 'Google Form ile Kayıt',
    shortLabel: 'Google Form',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    dotClass: 'bg-purple-400',
  },
  interactive: {
    label: 'İnteraktif Kayıttan Ekleme',
    shortLabel: 'İnteraktif Kayıt',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    dotClass: 'bg-emerald-400',
  },
  prereq_attend: {
    label: 'Ön Koşul & İlk Derse Katılım',
    shortLabel: 'İlk Ders & Transkript',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    dotClass: 'bg-amber-400',
  },
  attend: {
    label: 'İlk Derse Katılım Şartı',
    shortLabel: 'İlk Derse Katılım',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    dotClass: 'bg-orange-400',
  },
  contact: {
    label: 'Asistan İle İletişim',
    shortLabel: 'Asistan İletişimi',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    dotClass: 'bg-cyan-400',
  },
};
