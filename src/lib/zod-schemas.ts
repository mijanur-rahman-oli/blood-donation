import { z } from "zod";

import {
  BLOOD_GROUPS,
  DONOR_MAX_AGE,
  DONOR_MAX_WEIGHT_KG,
  DONOR_MIN_AGE,
  DONOR_MIN_WEIGHT_KG,
  PAYMENT_PURPOSES,
  PRIORITIES,
  ROLES,
} from "./constants";

/* ----------------------------------------------------------------------
   Shared primitives
   ---------------------------------------------------------------------- */

const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;

const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const nameField = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(80, "Name is too long");

const phoneField = z
  .string()
  .trim()
  .regex(bdPhoneRegex, "Enter a valid BD phone number (e.g. 01712-345678)");

const optionalPhoneField = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => !value || bdPhoneRegex.test(value),
    "Enter a valid BD phone number (e.g. 01712-345678)",
  );

const bloodGroupEnum = z.enum(BLOOD_GROUPS, {
  errorMap: () => ({ message: "Select a valid blood group" }),
});

const priorityEnum = z.enum(PRIORITIES, {
  errorMap: () => ({ message: "Select a valid priority" }),
});

const roleEnum = z.enum(ROLES, {
  errorMap: () => ({ message: "Select a valid role" }),
});

const paymentPurposeEnum = z.enum(PAYMENT_PURPOSES, {
  errorMap: () => ({ message: "Select a valid payment purpose" }),
});

/* ----------------------------------------------------------------------
   Auth
   ---------------------------------------------------------------------- */

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
  redirect: z.string().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: nameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password"),
    role: z.enum(["DONOR", "REQUESTER"], {
      errorMap: () => ({ message: "Choose Donor or Requester" }),
    }),
    phone: phoneField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type RegisterInput = z.infer<typeof registerSchema>;

/* ----------------------------------------------------------------------
   Profile
   ---------------------------------------------------------------------- */

export const profileUpdateSchema = z.object({
  name: nameField,
  phone: optionalPhoneField,
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/* ----------------------------------------------------------------------
   Donor profile
   ---------------------------------------------------------------------- */

export const donorProfileSchema = z.object({
  bloodGroup: bloodGroupEnum,
  location: z
    .string()
    .trim()
    .min(2, "Location is required")
    .max(120, "Location is too long"),
  weightKg: z
    .number({ invalid_type_error: "Enter a valid weight" })
    .min(DONOR_MIN_WEIGHT_KG, `Minimum weight is ${DONOR_MIN_WEIGHT_KG} kg`)
    .max(DONOR_MAX_WEIGHT_KG, `Maximum weight is ${DONOR_MAX_WEIGHT_KG} kg`),
  ageYears: z
    .number({ invalid_type_error: "Enter a valid age" })
    .int("Age must be a whole number")
    .min(DONOR_MIN_AGE, `Minimum age is ${DONOR_MIN_AGE}`)
    .max(DONOR_MAX_AGE, `Maximum age is ${DONOR_MAX_AGE}`),
  availability: z.boolean().default(true),
});
export type DonorProfileInput = z.infer<typeof donorProfileSchema>;

export const donorAvailabilitySchema = z.object({
  availability: z.boolean(),
});
export type DonorAvailabilityInput = z.infer<typeof donorAvailabilitySchema>;

/* ----------------------------------------------------------------------
   Blood requests
   ----------------------------------------------------------------------
   PROJECT.md defines the create form as a 3-step wizard:
     1. Patient    -> patientName, bloodGroup, units, priority
     2. Location   -> hospitalName, location, neededAt
     3. Contact    -> contactName, contactPhone, notes
   The combined `bloodRequestWizardSchema` is used by the wizard; the
   single-step `bloodRequestSchema` is kept for admin quick-create.
   ---------------------------------------------------------------------- */

const patientStepFields = {
  patientName: z
    .string()
    .trim()
    .min(2, "Patient name must be at least 2 characters")
    .max(80, "Patient name is too long"),
  bloodGroup: bloodGroupEnum,
  units: z
    .number({ invalid_type_error: "Enter a valid number of units" })
    .int("Units must be a whole number")
    .min(1, "At least 1 unit is required")
    .max(10, "Cannot request more than 10 units"),
  priority: priorityEnum,
};

const locationStepFields = {
  hospitalName: z
    .string()
    .trim()
    .min(2, "Hospital name is required")
    .max(120, "Hospital name is too long"),
  location: z
    .string()
    .trim()
    .min(2, "Location is required")
    .max(120, "Location is too long"),
  neededAt: z
    .string()
    .min(1, "Select when the blood is needed")
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Enter a valid date and time",
    }),
};

const contactStepFields = {
  contactName: z
    .string()
    .trim()
    .min(2, "Contact name is required")
    .max(80, "Contact name is too long"),
  contactPhone: phoneField,
  notes: z
    .string()
    .trim()
    .max(500, "Notes are too long")
    .optional()
    .or(z.literal("")),
};

export const bloodRequestSchema = z.object({
  ...patientStepFields,
  ...locationStepFields,
  ...contactStepFields,
});
export type BloodRequestInput = z.infer<typeof bloodRequestSchema>;

export const bloodRequestWizardSchema = z.object({
  ...patientStepFields,
  ...locationStepFields,
  ...contactStepFields,
});
export type BloodRequestWizardInput = z.infer<typeof bloodRequestWizardSchema>;

/** Per-step schemas let the wizard validate one step at a time. */
export const bloodRequestStepSchemas = [
  z.object(patientStepFields),
  z.object(locationStepFields),
  z.object(contactStepFields),
] as const;

/* ----------------------------------------------------------------------
   Payments
   ---------------------------------------------------------------------- */

export const paymentInitiateSchema = z.object({
  bloodRequestId: z.string().trim().min(1, "Blood request is required"),
  purpose: paymentPurposeEnum,
  amount: z
    .number({ invalid_type_error: "Enter a valid amount" })
    .int("Amount must be a whole number")
    .min(1, "Amount must be at least 1"),
  customerName: z
    .string()
    .trim()
    .min(2, "Customer name is required")
    .max(80, "Customer name is too long"),
  customerPhone: phoneField,
});
export type PaymentInitiateInput = z.infer<typeof paymentInitiateSchema>;

/* ----------------------------------------------------------------------
   Contact form (public page)
   ---------------------------------------------------------------------- */

export const contactSchema = z.object({
  name: nameField,
  email: emailField,
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters")
    .max(120, "Subject is too long"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message is too long"),
});
export type ContactInput = z.infer<typeof contactSchema>;

/* ----------------------------------------------------------------------
   Admin actions
   ---------------------------------------------------------------------- */

export const adminChangeRoleSchema = z.object({
  role: roleEnum,
});
export type AdminChangeRoleInput = z.infer<typeof adminChangeRoleSchema>;

export const adminChangeStatusSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"], {
    errorMap: () => ({ message: "Select a valid status" }),
  }),
});
export type AdminChangeStatusInput = z.infer<typeof adminChangeStatusSchema>;
