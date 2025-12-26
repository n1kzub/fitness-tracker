export const EFFORT_OPTIONS = ['Easy', 'Moderate', 'Hard'];
export const WORKOUT_STYLE_OPTIONS = ['Recovery', 'Easy', 'Steady', 'Tempo', 'Interval', 'Race'];
export const SURFACE_OPTIONS = ['Road', 'Trail', 'Treadmill', 'Track', 'Mixed'];

// For filter dropdowns:
export const EFFORT_FILTER_OPTIONS = ['All', ...EFFORT_OPTIONS];
export const WORKOUT_STYLE_FILTER_OPTIONS = ['All', ...WORKOUT_STYLE_OPTIONS];
export const SURFACE_FILTER_OPTIONS = ['All', ...SURFACE_OPTIONS];

export function applyRunFilters(runs, filters) {
  return runs.filter(r => {
    if (filters.effort && filters.effort !== 'All' && r.effort !== filters.effort) return false;
    if (filters.workoutStyle && filters.workoutStyle !== 'All' && r.workoutStyle !== filters.workoutStyle) return false;
    if (filters.surface && filters.surface !== 'All' && r.surface !== filters.surface) return false;
    return true;
  });
}
