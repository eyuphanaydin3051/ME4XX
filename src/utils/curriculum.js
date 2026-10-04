// src/utils/curriculum.js
import curriculaData from '../data/curricula.json';
import { evaluateSectionEligibility } from './surname';
import { schedulesConflict, sectionConflictsWithBlocked } from './timeSlots';

/**
 * Returns department curriculum info from curricula.json by abbreviation or department code.
 */
export function getDepartmentCurriculum(deptAbbrOrCode) {
  if (!deptAbbrOrCode) return null;
  const upper = deptAbbrOrCode.toUpperCase();

  // Check if direct department code exists
  if (curriculaData.departments[upper]) {
    return curriculaData.departments[upper];
  }

  // Check abbreviation index
  const code = curriculaData.abbrIndex[upper];
  if (code && curriculaData.departments[code]) {
    return curriculaData.departments[code];
  }

  // Fallback scan
  for (const dept of Object.values(curriculaData.departments)) {
    if (dept.abbr.toUpperCase() === upper) {
      return dept;
    }
  }

  return null;
}

/**
 * Returns available semester numbers for a department (e.g. [1, 2, 3, 4, 5, 6, 7, 8]).
 */
export function getAvailableSemesters(deptAbbrOrCode) {
  const dept = getDepartmentCurriculum(deptAbbrOrCode);
  if (!dept || !dept.semesters) return [1, 2, 3, 4, 5, 6, 7, 8];
  return Object.keys(dept.semesters)
    .map(Number)
    .sort((a, b) => a - b);
}

/**
 * Returns must courses for the specified department and semester from curricula.json.
 */
export function getMustCoursesForSemester(deptAbbrOrCode, semester) {
  const dept = getDepartmentCurriculum(deptAbbrOrCode);
  if (!dept || !dept.semesters || !dept.semesters[String(semester)]) {
    return [];
  }
  return dept.semesters[String(semester)];
}

/**
 * Checks whether a course has at least one scheduled slot on the weekly timetable.
 */
export function isCourseScheduled(course) {
  if (!course || !course.sections || course.sections.length === 0) return false;
  return course.sections.some(
    (s) => s.hasSchedule && Array.isArray(s.schedule) && s.schedule.length > 0
  );
}

/**
 * Checks whether a course is non-credit or has no lecture hours on the timetable
 * (e.g. OHS 101, OHS 301, ME 300, ME 400, IS 100, BA 100, etc.).
 */
export function isCourseNonCreditOrUnscheduled(course, mustCourseMeta = null) {
  if (mustCourseMeta && (mustCourseMeta.isNonCredit || mustCourseMeta.credit === 0)) {
    return true;
  }
  if (!course) return true;
  return !isCourseScheduled(course);
}

/**
 * Partitions the must courses of a department & semester into scheduled courses vs.
 * non-credit / unscheduled courses (Staj, OHS, IS100, etc.).
 */
export function partitionMustCourses(deptAbbrOrCode, semester, allCourses) {
  const musts = getMustCoursesForSemester(deptAbbrOrCode, semester);
  const scheduledMusts = [];
  const unscheduledMusts = [];

  for (const m of musts) {
    const fullCourse = matchMustCourseInCatalog(m, allCourses);
    const isUnscheduled = isCourseNonCreditOrUnscheduled(fullCourse, m);

    const item = {
      mustMeta: m,
      course: fullCourse,
      isAvailableInCatalog: !!fullCourse,
      isUnscheduled,
    };

    if (isUnscheduled) {
      unscheduledMusts.push(item);
    } else {
      scheduledMusts.push(item);
    }
  }

  return { scheduledMusts, unscheduledMusts };
}

/**
 * Matches a must course from curriculum to the full course record in all_courses.json.
 */
export function matchMustCourseInCatalog(mustCourse, allCourses) {
  if (!mustCourse || !allCourses) return null;

  const mustCodeStr = String(mustCourse.code);
  const mustAbbrNorm = mustCourse.abbr.replace(/\s+/g, '').toUpperCase();

  // 1. Direct match on 7-digit SIS course code
  let match = allCourses.find((c) => String(c.code) === mustCodeStr);
  if (match) return match;

  // 2. Normalized abbreviation match (e.g. "PHYS105" vs "PHYS 105")
  match = allCourses.find(
    (c) => c.codeStr.replace(/\s+/g, '').toUpperCase() === mustAbbrNorm
  );
  if (match) return match;

  // 3. Match on department and course number
  const abbrMatch = mustCourse.abbr.match(/^([A-Z]+)\s*(\d+)$/i);
  if (abbrMatch) {
    const [, dept, num] = abbrMatch;
    match = allCourses.find(
      (c) =>
        (c.department || '').toUpperCase() === dept.toUpperCase() &&
        String(c.courseNumber) === num
    );
    if (match) return match;
  }

  return null;
}

/**
 * Finds the best section for a course based on surname criteria, schedule availability, and conflict avoidance.
 */
export function autoSelectEligibleSection(
  course,
  surname = '',
  dept = '',
  blockedSlots = new Set(),
  currentSelections = []
) {
  if (!course || !course.sections || course.sections.length === 0) return null;

  const validSections = course.sections.filter((s) => s.hasSchedule);
  const candidates = validSections.length > 0 ? validSections : course.sections;

  // Score each section:
  // - Criteria match score: +10 if eligible, -10 if strictly not eligible
  // - Conflict score: -50 if conflicts with existing selected courses or blocked slots
  // - Low section number preference: small tie-breaker
  let bestSection = candidates[0];
  let highestScore = -Infinity;

  for (const sec of candidates) {
    let score = 0;

    // Surname / Dept eligibility
    if (surname || dept) {
      const evalRes = evaluateSectionEligibility(sec, surname, dept);
      if (evalRes.eligible) {
        score += 20;
      } else {
        score -= 20;
      }
    }

    // Blocked slot conflict
    if (sec.schedule && sectionConflictsWithBlocked(sec.schedule, blockedSlots)) {
      score -= 50;
    }

    // Conflict with already selected courses
    if (sec.schedule && currentSelections.length > 0) {
      const hasConflict = currentSelections.some((sel) => {
        if (!sel.section || !sel.section.schedule) return false;
        if (sel.course.code === course.code) return false;
        return schedulesConflict(sel.section.schedule, sec.schedule);
      });
      if (hasConflict) {
        score -= 100;
      }
    }

    // Tie-breaker: prefer smaller section numbers
    score -= (sec.sectionNumber || 1) * 0.1;

    if (score > highestScore) {
      highestScore = score;
      bestSection = sec;
    }
  }

  return bestSection;
}
