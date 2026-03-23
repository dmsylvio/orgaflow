import { z } from "zod";

/** Planos alinhados ao enum DB `subscription_plan`: starter = Free; growth e scale = pagos. */
export const workspacePlanSchema = z.enum(["starter", "growth", "scale"]);

/** Intervalo de faturação para Checkout Stripe (planos pagos). */
export const workspaceBillingIntervalSchema = z.enum(["monthly", "annual"]);

export const createOrganizationInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  addressLine1: z.string().trim().min(2, "Street address is required").max(200),
  addressLine2: z.string().trim().max(200),
  city: z.string().trim().min(1, "City is required").max(120),
  region: z.string().trim().max(120),
  postalCode: z.string().trim().min(1, "Postal code is required").max(32),
  businessPhone: z.string().trim().max(40),
  languageCode: z.string().min(1, "Select a language").max(10),
  defaultCurrencyId: z.string().min(1, "Select a default currency"),
  plan: workspacePlanSchema,
  billingInterval: workspaceBillingIntervalSchema.default("monthly"),
});

/** Passo “detalhes” antes de escolher o plano (validação no cliente). */
export const createOrganizationDetailsSchema =
  createOrganizationInputSchema.omit({ plan: true, billingInterval: true });

export type WorkspacePlan = z.infer<typeof workspacePlanSchema>;
export type WorkspaceBillingInterval = z.infer<
  typeof workspaceBillingIntervalSchema
>;
export type CreateOrganizationInput = z.infer<
  typeof createOrganizationInputSchema
>;
export type CreateOrganizationDetailsInput = z.infer<
  typeof createOrganizationDetailsSchema
>;
