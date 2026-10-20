const departmentMap = {
  pothole: 'Road & Infrastructure Department',
  road: 'Road & Infrastructure Department',
  crack: 'Road & Infrastructure Department',
  garbage: 'Sanitation Department',
  waste: 'Sanitation Department',
  trash: 'Sanitation Department',
  litter: 'Sanitation Department',
  streetlight: 'Electricity Department',
  light: 'Electricity Department',
  electrical: 'Electricity Department',
  drainage: 'Water & Sewage Department',
  sewage: 'Water & Sewage Department',
  flood: 'Water & Sewage Department',
  water: 'Water & Sewage Department',
  tree: 'Parks & Environment Department',
  park: 'Parks & Environment Department',
  noise: 'Pollution Control Department',
  pollution: 'Pollution Control Department',
  traffic: 'Traffic & Transport Department',
  signal: 'Traffic & Transport Department',
};

/**
 * Suggest a department based on problem type string.
 * Matches keywords within the problemType.
 */
export const getDepartment = (problemType) => {
  if (!problemType) return 'General Municipal Department';
  const lower = problemType.toLowerCase();
  for (const [keyword, dept] of Object.entries(departmentMap)) {
    if (lower.includes(keyword)) {
      return dept;
    }
  }
  return 'General Municipal Department';
};

export default departmentMap;
