export const SPECIALIZATIONS = [
  'Cardiology',
  'Dermatology',
  'General Practice',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Psychiatry',
] as const;

export type Specialization = typeof SPECIALIZATIONS[number];

export const SPECIALIZATION_OPTIONS: Array<{ value: Specialization; label: Specialization }> =
  SPECIALIZATIONS.map((spec) => ({ value: spec, label: spec }));

export const DOCTOR_SORT = {
  RATING: 'rating',
  FEE: 'consultationFee',
  EXPERIENCE: 'experienceYears',
  POPULARITY: 'totalAppointments',
} as const;

export type DoctorSortField = typeof DOCTOR_SORT[keyof typeof DOCTOR_SORT];

export const DOCTOR_SORT_OPTIONS: Array<{ value: DoctorSortField; label: string }> = [
  { value: DOCTOR_SORT.RATING, label: 'Highest Rated' },
  { value: DOCTOR_SORT.FEE, label: 'Fee: Low to High' },
  { value: DOCTOR_SORT.EXPERIENCE, label: 'Most Experience' },
  { value: DOCTOR_SORT.POPULARITY, label: 'Most Popular' },
];
