import type { ReactNode } from 'react';

// ─── Role & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'patient' | 'doctor' | 'admin';
export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

export interface User {
  _id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  isEmailVerified: boolean;
  isActive: boolean;
}

// ─── API Response envelope ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ─── Appointment ─────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface AppointmentDoctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
  avatar?: string;
}

export interface AppointmentPatient {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface Appointment {
  _id: string;
  doctor: AppointmentDoctor;
  patient: AppointmentPatient;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason?: string;
  cancelReason?: string;
  notes?: string;
  createdAt: string;
}

// ─── Doctor ──────────────────────────────────────────────────────────────────

export type WeekDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface WorkingHours {
  start: string;
  end: string;
}

export interface DoctorProfile {
  _id: string;
  user: User;
  specialization?: string;
  bio?: string;
  qualifications: string[];
  consultationFee?: number;
  isApproved: boolean;
  isActive: boolean;
  workingDays: WeekDay[];
  workingHours: WorkingHours;
  slotDuration: number;
}

export interface DoctorSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface DoctorAvailability {
  date: string;
  slots: DoctorSlot[];
}

// ─── Patient ─────────────────────────────────────────────────────────────────

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface EmergencyContact {
  name?: string;
  phone?: string;
}

export type Gender = 'male' | 'female' | 'other' | 'prefer-not-to-say';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface PatientProfile {
  _id: string;
  user: User;
  dateOfBirth?: string;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  phone?: string;
  address?: Address;
  medicalHistory: string[];
  allergies: string[];
  emergencyContact?: EmergencyContact;
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  counts: {
    doctors: number;
    patients: number;
    appointments: number;
    pendingApprovals: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
  };
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

// ─── Paginated response ──────────────────────────────────────────────────────

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
