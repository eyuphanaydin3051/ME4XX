// src/utils/storage.js

const STORAGE_KEY = 'metu_me_scheduler_state_v1';
const PLANS_KEY = 'metu_me_scheduler_saved_plans_v1';

export function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load state from localStorage:', e);
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state to localStorage:', e);
  }
}

/**
 * Gets all saved user plans from localStorage
 */
export function getSavedPlans() {
  try {
    const raw = localStorage.getItem(PLANS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load plans from localStorage:', e);
    return [];
  }
}

/**
 * Saves a new named plan to localStorage
 */
export function saveNamedPlan(name, planData) {
  try {
    const plans = getSavedPlans();
    const newPlan = {
      id: 'plan_' + Date.now(),
      name: name.trim() || `Plan ${plans.length + 1}`,
      createdAt: new Date().toISOString(),
      ...planData,
    };
    const updated = [newPlan, ...plans];
    localStorage.setItem(PLANS_KEY, JSON.stringify(updated));
    return newPlan;
  } catch (e) {
    console.warn('Failed to save plan:', e);
    return null;
  }
}

/**
 * Deletes a named plan by ID
 */
export function deleteNamedPlan(id) {
  try {
    const plans = getSavedPlans();
    const updated = plans.filter((p) => p.id !== id);
    localStorage.setItem(PLANS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to delete plan:', e);
    return [];
  }
}

/**
 * Downloads a plan as a JSON file
 */
export function downloadPlanAsJSON(planData, filename = null) {
  try {
    const jsonStr = JSON.stringify(
      {
        version: '1.0',
        appName: 'METU ME Course Scheduler',
        exportedAt: new Date().toISOString(),
        ...planData,
      },
      null,
      2
    );
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `ODTU_ME_Plan_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (e) {
    console.error('Failed to download plan JSON:', e);
    return false;
  }
}

/**
 * Parses and validates an uploaded plan JSON
 */
export function parsePlanFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      throw new Error('Geçersiz JSON formatı.');
    }
    return data;
  } catch (e) {
    throw new Error('Dosya okunamadı: ' + e.message);
  }
}
