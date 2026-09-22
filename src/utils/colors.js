// src/utils/colors.js

export const COURSE_COLORS = [
  {
    bg: 'bg-indigo-600/90 hover:bg-indigo-600',
    border: 'border-indigo-400',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    text: 'text-white',
    accent: '#6366f1',
  },
  {
    bg: 'bg-emerald-600/90 hover:bg-emerald-600',
    border: 'border-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    text: 'text-white',
    accent: '#10b981',
  },
  {
    bg: 'bg-amber-600/90 hover:bg-amber-600',
    border: 'border-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    text: 'text-white',
    accent: '#f59e0b',
  },
  {
    bg: 'bg-rose-600/90 hover:bg-rose-600',
    border: 'border-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    text: 'text-white',
    accent: '#f43f5e',
  },
  {
    bg: 'bg-cyan-600/90 hover:bg-cyan-600',
    border: 'border-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    text: 'text-white',
    accent: '#06b6d4',
  },
  {
    bg: 'bg-purple-600/90 hover:bg-purple-600',
    border: 'border-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    text: 'text-white',
    accent: '#a855f7',
  },
  {
    bg: 'bg-teal-600/90 hover:bg-teal-600',
    border: 'border-teal-400',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    text: 'text-white',
    accent: '#14b8a6',
  },
  {
    bg: 'bg-orange-600/90 hover:bg-orange-600',
    border: 'border-orange-400',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    text: 'text-white',
    accent: '#f97316',
  },
  {
    bg: 'bg-blue-600/90 hover:bg-blue-600',
    border: 'border-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    text: 'text-white',
    accent: '#3b82f6',
  },
  {
    bg: 'bg-fuchsia-600/90 hover:bg-fuchsia-600',
    border: 'border-fuchsia-400',
    badge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
    text: 'text-white',
    accent: '#d946ef',
  },
];

/**
 * Returns consistent styling object for a given course code
 */
export function getCourseColor(courseCode) {
  let hash = 0;
  for (let i = 0; i < courseCode.length; i++) {
    hash = (hash * 31 + courseCode.charCodeAt(i)) % COURSE_COLORS.length;
  }
  return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
}
