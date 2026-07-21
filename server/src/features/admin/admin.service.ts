import { User } from '../user/user.model.js';
import { Doctor } from '../doctor/doctor.model.js';
import { Patient } from '../patient/patient.model.js';
import { Appointment } from '../appointment/appointment.model.js';
import { doctorService } from '../doctor/doctor.service.js';
import { patientService } from '../patient/patient.service.js';
import { appointmentService } from '../appointment/appointment.service.js';
import { ApiError } from '../../utils/ApiError.js';

export const adminService = {
  async getDashboard() {
    const [byRole, byApproval, patientCount, byStatus, revenueAgg] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Doctor.aggregate([{ $group: { _id: '$isApproved', count: { $sum: 1 } } }]),
      Patient.countDocuments(),
      Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Appointment.aggregate([
        { $match: { status: 'completed', paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$fee' } } },
      ]),
    ]);

    const usersByRole = Object.fromEntries(byRole.map((r) => [r._id ?? 'unknown', r.count]));
    const approvedCount = byApproval.find((d) => d._id === true)?.count ?? 0;
    const unapprovedCount = byApproval.find((d) => d._id === false)?.count ?? 0;
    const appointmentsByStatus = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
    const totalRevenue = revenueAgg[0]?.total ?? 0;

    return {
      users: {
        total:
          (usersByRole.patient ?? 0) +
          (usersByRole.doctor ?? 0) +
          (usersByRole.admin ?? 0),
        byRole: usersByRole,
      },
      doctors: {
        total: approvedCount + unapprovedCount,
        approved: approvedCount,
        unapproved: unapprovedCount,
      },
      patients: { total: patientCount },
      appointments: {
        total: Object.values(appointmentsByStatus).reduce((sum: number, n: any) => sum + Number(n), 0),
        byStatus: appointmentsByStatus,
      },
      revenue: { total: totalRevenue },
    };
  },

  async listDoctors(query: any) {
    const filters: any = {};
    if (query.isApproved !== undefined) filters.isApproved = query.isApproved === 'true';
    if (query.isActive !== undefined) filters.isActive = query.isActive === 'true';
    if (query.specialization) filters.specialization = query.specialization;
    return doctorService.listForAdmin({ ...query, ...filters });
  },

  async manageDoctor(id: string | object, action: string) {
    if (action === 'approve') return doctorService.setApproved(id, true);
    if (action === 'reject') return doctorService.setApproved(id, false);
    if (action === 'deactivate') return doctorService.setActive(id, false);
    if (action === 'activate') return doctorService.setActive(id, true);
    throw ApiError.badRequest('INVALID_ACTION', `Unknown action: ${action}`);
  },

  async listPatients(query: any) {
    const filters: any = {};
    if (query.search) filters.search = query.search;
    if (query.gender) filters.gender = query.gender;
    return patientService.listForAdmin({ ...query, ...filters });
  },

  async listAppointments(query: any) {
    return appointmentService.listForAdmin(query);
  },
};
