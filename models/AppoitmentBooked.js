// server/models/AppoitmentBooked.js
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    patientId: {
      type: String,
      required: true,
      index: true, // 🔑 used by My Appointments
    },

    patientEmail: {
      type: String,
      required: true,
    },

    doctorId: {
      type: String,
      default: null,
    },

    approvedDoctorId: {
      type: String,
      default: null,
    },

    chiefComplaint: {
      type: String,
      required: true,
    },

    appointmentDate: {
      type: String,
      required: true,
    },

    appointmentTime: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "rescheduled", "cancelled"],
      default: "pending",
    },

    originalBookingId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // ✅ required for sorting by createdAt
  }
);

/*
  ✅ IMPORTANT:
  - Model name MUST be "Appointment"
  - Collection is explicitly forced to "appointments"
  - Prevents model overwrite errors in dev mode
*/
export const Appointment =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema, "appointments");

export default Appointment;