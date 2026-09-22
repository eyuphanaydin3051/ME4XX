// src/utils/solver.js
import { DAYS, getSlotKey, schedulesConflict, sectionConflictsWithBlocked } from './timeSlots';

/**
 * Evaluates the quality metrics of a schedule
 * @param {Array} scheduledCourses - array of { course, section }
 * @returns {Object} score metrics
 */
export function evaluateSchedule(scheduledCourses) {
  // Map day -> array of slot indices occupied
  const daySlots = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
  };

  for (const item of scheduledCourses) {
    for (const block of item.section.schedule || []) {
      if (daySlots[block.dayEn]) {
        daySlots[block.dayEn].push(...(block.slots || []));
      }
    }
  }

  let freeDaysCount = 0;
  const freeDays = [];
  let totalGapHours = 0;
  let earlyStartsCount = 0;
  let totalClassHours = 0;
  const dailyLoads = [];

  for (const day of DAYS) {
    const slots = Array.from(new Set(daySlots[day.id])).sort((a, b) => a - b);
    const count = slots.length;
    dailyLoads.push(count);
    totalClassHours += count;

    if (count === 0) {
      freeDaysCount++;
      freeDays.push(day.label);
    } else {
      // Check 08:40 start
      if (slots[0] === 0) {
        earlyStartsCount++;
      }
      // Gaps between first and last class
      const span = slots[slots.length - 1] - slots[0] + 1;
      const gaps = span - count;
      totalGapHours += gaps;
    }
  }

  // Calculate load variance (for balance)
  const avgLoad = totalClassHours / 5;
  const variance = dailyLoads.reduce((acc, val) => acc + Math.pow(val - avgLoad, 2), 0) / 5;

  return {
    freeDaysCount,
    freeDays,
    totalGapHours,
    earlyStartsCount,
    totalClassHours,
    dailyLoads,
    variance,
  };
}

/**
 * Generates all valid course schedule variations
 */
export function generateVariations({
  fixedSelections, // [{ course, section }] where section can be specific or null
  targetTotalCount, // integer
  blockedSlotsSet, // Set of 'Day-Slot'
  me4Pool, // Array of ME4 course objects
  enabledMe4Codes = null, // Set of course codes allowed, or null for all
  sortCriterion = 'free_days', // 'free_days' | 'compact' | 'late_start' | 'balanced'
  maxResults = 250,
}) {
  // Step 1: Separate fixed selections with specific sections vs "any section"
  const concreteFixed = [];
  const flexibleFixed = [];

  for (const item of fixedSelections) {
    if (item.section) {
      // Specific section chosen by user
      concreteFixed.push(item);
    } else {
      // User selected course but said "any section"
      flexibleFixed.push(item);
    }
  }

  // Validate that concreteFixed don't conflict with each other or blocked hours
  for (let i = 0; i < concreteFixed.length; i++) {
    const a = concreteFixed[i];
    if (sectionConflictsWithBlocked(a.section.schedule, blockedSlotsSet)) {
      return {
        success: false,
        error: `${a.course.codeStr} (Section ${a.section.sectionNumber}) blokladığınız saatlerle çakışıyor.`,
        variations: [],
      };
    }
    for (let j = i + 1; j < concreteFixed.length; j++) {
      const b = concreteFixed[j];
      if (schedulesConflict(a.section.schedule, b.section.schedule)) {
        return {
          success: false,
          error: `${a.course.codeStr} (Section ${a.section.sectionNumber}) ile ${b.course.codeStr} (Section ${b.section.sectionNumber}) arasında ders saati çakışması var.`,
          variations: [],
        };
      }
    }
  }

  // How many elective ME4 courses needed
  const totalFixedCount = fixedSelections.length;
  const electivesNeeded = Math.max(0, targetTotalCount - totalFixedCount);

  // Filter ME4 courses pool
  const candidateMe4Courses = (me4Pool || []).filter((c) => {
    // Cannot pick an already fixed course
    if (fixedSelections.some((f) => f.course.code === c.code)) {
      return false;
    }
    // Must be enabled by user
    if (enabledMe4Codes && !enabledMe4Codes.has(c.code)) {
      return false;
    }
    // Must have at least one scheduled section
    return c.sections && c.sections.some((s) => s.hasSchedule);
  });

  const variations = [];

  // Helper recursive solver for flexible fixed courses + electives
  function solve(
    currentSchedule, // array of { course, section }
    remainingFlexibleFixed, // list of course objects needing section
    me4StartIndex,
    electivesRemaining
  ) {
    if (variations.length >= maxResults * 3) return; // Cutoff for speed

    // First assign sections to remaining flexible fixed courses
    if (remainingFlexibleFixed.length > 0) {
      const currentCourse = remainingFlexibleFixed[0];
      const validSections = (currentCourse.course.sections || []).filter(
        (s) => s.hasSchedule && !sectionConflictsWithBlocked(s.schedule, blockedSlotsSet)
      );

      for (const sec of validSections) {
        // Check collision with already placed courses
        const collides = currentSchedule.some((placed) =>
          schedulesConflict(placed.section.schedule, sec.schedule)
        );
        if (!collides) {
          solve(
            [...currentSchedule, { course: currentCourse.course, section: sec }],
            remainingFlexibleFixed.slice(1),
            me4StartIndex,
            electivesRemaining
          );
        }
      }
      return;
    }

    // Next: If we reached target electivesNeeded, record variation!
    if (electivesRemaining === 0) {
      const metrics = evaluateSchedule(currentSchedule);
      variations.push({
        id: `var-${variations.length + 1}`,
        items: currentSchedule,
        addedElectives: currentSchedule.filter(
          (item) => !fixedSelections.some((f) => f.course.code === item.course.code)
        ),
        metrics,
      });
      return;
    }

    // Try picking electives from ME4 candidate pool
    for (let i = me4StartIndex; i < candidateMe4Courses.length; i++) {
      const course = candidateMe4Courses[i];
      const validSections = (course.sections || []).filter(
        (s) => s.hasSchedule && !sectionConflictsWithBlocked(s.schedule, blockedSlotsSet)
      );

      for (const sec of validSections) {
        const collides = currentSchedule.some((placed) =>
          schedulesConflict(placed.section.schedule, sec.schedule)
        );
        if (!collides) {
          solve(
            [...currentSchedule, { course, section: sec }],
            [],
            i + 1, // distinct course
            electivesRemaining - 1
          );
        }
      }
    }
  }

  // Run solver
  solve(concreteFixed, flexibleFixed, 0, electivesNeeded);

  // Step 4: Sort variations based on chosen criterion
  variations.sort((a, b) => {
    if (sortCriterion === 'free_days') {
      // More free days first
      if (b.metrics.freeDaysCount !== a.metrics.freeDaysCount) {
        return b.metrics.freeDaysCount - a.metrics.freeDaysCount;
      }
      // Then less gaps
      if (a.metrics.totalGapHours !== b.metrics.totalGapHours) {
        return a.metrics.totalGapHours - b.metrics.totalGapHours;
      }
      // Then fewer 8:40 starts
      return a.metrics.earlyStartsCount - b.metrics.earlyStartsCount;
    } else if (sortCriterion === 'compact') {
      // Min gap hours first
      if (a.metrics.totalGapHours !== b.metrics.totalGapHours) {
        return a.metrics.totalGapHours - b.metrics.totalGapHours;
      }
      // Then more free days
      if (b.metrics.freeDaysCount !== a.metrics.freeDaysCount) {
        return b.metrics.freeDaysCount - a.metrics.freeDaysCount;
      }
      return a.metrics.earlyStartsCount - b.metrics.earlyStartsCount;
    } else if (sortCriterion === 'late_start') {
      // Fewest 08:40 starts first
      if (a.metrics.earlyStartsCount !== b.metrics.earlyStartsCount) {
        return a.metrics.earlyStartsCount - b.metrics.earlyStartsCount;
      }
      // Then more free days
      if (b.metrics.freeDaysCount !== a.metrics.freeDaysCount) {
        return b.metrics.freeDaysCount - a.metrics.freeDaysCount;
      }
      return a.metrics.totalGapHours - b.metrics.totalGapHours;
    } else if (sortCriterion === 'balanced') {
      // Lowest variance across 5 days
      if (a.metrics.variance !== b.metrics.variance) {
        return a.metrics.variance - b.metrics.variance;
      }
      return a.metrics.totalGapHours - b.metrics.totalGapHours;
    }
    return 0;
  });

  return {
    success: true,
    totalFound: variations.length,
    electivesNeeded,
    variations: variations.slice(0, maxResults),
  };
}
