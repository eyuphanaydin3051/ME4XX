// src/utils/surname.js

export const TURKISH_ALPHABET = {
  A: 1, B: 2, C: 3, Ç: 4, D: 5, E: 6, F: 7, G: 8, Ğ: 9, H: 10,
  I: 11, İ: 12, J: 13, K: 14, L: 15, M: 16, N: 17, O: 18, Ö: 19,
  P: 20, Q: 21, R: 22, S: 23, Ş: 24, T: 25, U: 26, Ü: 27, V: 28,
  W: 29, X: 30, Y: 31, Z: 32,
};

/**
 * Normalizes text to uppercase Turkish letters only
 */
export function normalizeTurkishLetters(str) {
  if (!str) return '';
  return String(str)
    .trim()
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .toLocaleUpperCase('tr-TR')
    .replace(/[^A-ZÇĞİÖŞÜ]/g, '');
}

/**
 * Computes numeric rank for a 2-letter Turkish surname prefix
 * Weighs both letters together (first * 100 + second)
 */
export function rankLetters(letters, isEnd = false) {
  const norm = normalizeTurkishLetters(letters);
  if (!norm || norm.length === 0) return undefined;

  const first = TURKISH_ALPHABET[norm[0]];
  if (first === undefined) return undefined;

  let second;
  if (norm.length >= 2) {
    second = TURKISH_ALPHABET[norm[1]];
  } else {
    second = isEnd ? 32 : 1; // 'Z' if end range, 'A' if start range
  }
  if (second === undefined) second = isEnd ? 32 : 1;

  return first * 100 + second;
}

/**
 * Checks whether a given student surname falls within startChar and endChar range
 */
export function surnameCheck(studentSurname, startChar, endChar) {
  const cleanSurname = normalizeTurkishLetters(studentSurname);
  if (!cleanSurname) return true; // If no surname entered, don't reject
  if (!startChar && !endChar) return true;

  const sRank = rankLetters(cleanSurname.slice(0, 2), false);
  const startRank = rankLetters(startChar || 'AA', false);
  const endRank = rankLetters(endChar || 'ZZ', true);

  if (sRank === undefined || startRank === undefined || endRank === undefined) {
    return true;
  }

  return startRank <= sRank && sRank <= endRank;
}

/**
 * Evaluates whether a section is admissible for a student with given department and surname
 * Accepts either:
 * - evaluateSectionEligibility(section, studentDept, studentSurname, settings)
 * - evaluateSectionEligibility(section, studentSurname, studentDept, settings)
 * - evaluateSectionEligibility(section, { studentDept, studentSurname, checkDept, checkSurname })
 *
 * @returns {Object} { eligible, isAdmissible, status, badgeLabel, badgeClass, details, reason, matchedCriterion }
 */
export function evaluateSectionEligibility(
  section,
  argDeptOrObj = '',
  argSurname = '',
  settings = { checkDept: true, checkSurname: true }
) {
  let studentDept = '';
  let studentSurname = '';
  let checkDept = true;
  let checkSurname = true;

  // 1. If options passed as object in 2nd argument
  if (typeof argDeptOrObj === 'object' && argDeptOrObj !== null) {
    studentDept = argDeptOrObj.studentDept || argDeptOrObj.dept || argDeptOrObj.department || '';
    studentSurname = argDeptOrObj.studentSurname || argDeptOrObj.surname || '';
    if (argDeptOrObj.checkDept !== undefined) checkDept = argDeptOrObj.checkDept;
    if (argDeptOrObj.checkSurname !== undefined) checkSurname = argDeptOrObj.checkSurname;
  } else {
    const s1 = String(argDeptOrObj || '').trim();
    const s2 = String(argSurname || '').trim();

    if (typeof settings === 'object' && settings !== null) {
      if (settings.checkDept !== undefined) checkDept = settings.checkDept;
      if (settings.checkSurname !== undefined) checkSurname = settings.checkSurname;
    }

    // Smart detection: determine which is department and which is surname
    const sectionDepts = (section?.criteria || []).map((c) => (c.given_dept || '').toUpperCase());
    const s1IsDept = sectionDepts.includes(s1.toUpperCase()) || (s1.length <= 4 && s2.length > 4);
    const s2IsDept = sectionDepts.includes(s2.toUpperCase()) || (s2.length <= 4 && s1.length > 4);

    if (s2IsDept && !s1IsDept) {
      studentDept = s2;
      studentSurname = s1;
    } else {
      studentDept = s1;
      studentSurname = s2;
    }
  }

  // If section has no criteria, open to everyone
  if (!section || !section.criteria || section.criteria.length === 0) {
    return {
      eligible: true,
      isAdmissible: true,
      hasCriteria: false,
      status: 'open_to_all',
      badgeLabel: 'Herkes Alabilir',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
      details: 'Bu şube için özel bir bölüm veya soyad kısıtı bulunmamaktadır.',
      reason: 'Bu şube için özel bir bölüm veya soyad kısıtı bulunmamaktadır.',
      matchedCriterion: null,
    };
  }

  const deptUpper = (studentDept || '').trim().toUpperCase();
  const surnameClean = (studentSurname || '').trim();

  let matchedCrit = null;
  let deptMatchedAny = false;

  for (const crit of section.criteria) {
    const givenDept = (crit.given_dept || 'ALL').trim().toUpperCase();
    const deptMatch = !checkDept || givenDept === 'ALL' || (deptUpper && givenDept === deptUpper);

    if (deptMatch) {
      deptMatchedAny = true;
      const startC = crit.start_char || 'AA';
      const endC = crit.end_char || 'ZZ';
      const surnMatch = !checkSurname || !surnameClean || surnameCheck(surnameClean, startC, endC);

      if (surnMatch) {
        matchedCrit = crit;
        break;
      }
    }
  }

  if (matchedCrit) {
    const startC = matchedCrit.start_char || 'AA';
    const endC = matchedCrit.end_char || 'ZZ';
    const deptStr = matchedCrit.given_dept || 'ALL';
    const details = `${deptStr} • ${startC} - ${endC}`;
    return {
      eligible: true,
      isAdmissible: true,
      hasCriteria: true,
      status: 'admissible',
      badgeLabel: 'Kriterinize Uygun',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/30',
      details,
      reason: details,
      matchedCriterion: matchedCrit,
    };
  }

  // Not admissible: Check if failure was surname or department
  if (deptMatchedAny) {
    const validRanges = section.criteria
      .filter((c) => !checkDept || (c.given_dept || 'ALL').toUpperCase() === 'ALL' || (c.given_dept || '').toUpperCase() === deptUpper)
      .map((c) => `${c.start_char || 'AA'}-${c.end_char || 'ZZ'}`)
      .join(', ');

    const details = `Şube soyad aralığı: ${validRanges || 'Farklı aralık'}`;
    return {
      eligible: false,
      isAdmissible: false,
      hasCriteria: true,
      status: 'surname_mismatch',
      badgeLabel: 'Soyad Kriteri Dışı',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/30',
      details,
      reason: details,
      matchedCriterion: null,
    };
  }

  // Department mismatch
  const targetDepts = Array.from(new Set(section.criteria.map((c) => c.given_dept || 'ALL'))).join(', ');
  const details = `Sadece ${targetDepts} öğrencilerine açık`;
  return {
    eligible: false,
    isAdmissible: false,
    hasCriteria: true,
    status: 'dept_mismatch',
    badgeLabel: 'Bölüm Kriteri Dışı',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300 border-rose-500/30',
    details,
    reason: details,
    matchedCriterion: null,
  };
}
