// src/utils/prerequisites.js
import PREREQUISITES from '../data/prerequisites.json';

/**
 * Returns prerequisite string for a course (e.g., 'ME 304') or null if not found
 * @param {string} courseCode - e.g. 'ME 414' or '5690414'
 */
export function getCoursePrerequisite(courseCode) {
  if (!courseCode) return null;
  // Normalize: 'ME 414' or '414'
  if (PREREQUISITES[courseCode]) {
    return PREREQUISITES[courseCode];
  }
  // Try extracting course number if it's full code like 5690414
  if (courseCode.startsWith('5690')) {
    const num = courseCode.slice(4);
    const key = `ME ${parseInt(num, 10)}`;
    if (PREREQUISITES[key]) return PREREQUISITES[key];
  }
  return null;
}
