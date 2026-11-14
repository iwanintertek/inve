import { z } from 'zod';

export const MaterialStatusEnum = z.enum([
  'On The Way',
  'Analysis',
  'Canceled',
  'Done'
]);

export const standardLocations = [
  'FPU',
  'ORF',
  'PSTB',
  'Somber / Altus',
  'Intertek Balikpapan',
  'Intertek Jakarta',
  'Handayani'
] as const;

export const sixCheckpoints = [
  'FPU',
  'ORF',
  'PSTB',
  'Somber / Altus',
  'Intertek Balikpapan',
  'Intertek Jakarta'
] as const;

export const materialSchema = z.object({
  no: z.string().optional().nullable(),
  status: MaterialStatusEnum.default('On The Way'),
  deliveryDate: z.string().optional().nullable(),
  pointOfOrigin: z.string().min(1, 'Point of origin is required'),
  pointOfDelivery: z.string().min(1, 'Point of delivery is required'),
  shippingRequirements: z.string().optional().nullable(),
  shipmentBy: z.string().optional().nullable(),
  itemDescription: z.string().min(1, 'Item description is required'),
  pic: z.string().min(1, 'PIC is required'),
  technicalProposalStatus: z.string().optional().nullable(),
  costProposalStatus: z.string().optional().nullable(),
  statusCoff: z.string().optional().nullable(),
  noCoff: z.string().optional().nullable(),
  analysisRequested: z.string().optional().nullable(),
  finalStatusReport: z.string().optional().nullable(),
  remarkRaw: z.string().optional().nullable(),
  remarkStructured: z.string().optional().nullable(),
  remarkParseNote: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
});

export const materialUpdateSchema = materialSchema.partial().extend({
  id: z.coerce.number().positive(),
});

export type MaterialInput = z.infer<typeof materialSchema>;
export type MaterialUpdateInput = z.infer<typeof materialUpdateSchema>;
export type MaterialStatus = z.infer<typeof MaterialStatusEnum>;

// Compatibility aliases
export const itemSchema = materialSchema;
export const itemUpdateSchema = materialUpdateSchema;
export const stockTransactionSchema = z.object({
  item_id: z.coerce.number().optional().nullable(),
  transaction_type: z.string().optional().nullable(),
  quantity: z.coerce.number().optional().nullable(),
  purpose: z.string().optional().nullable(),
  performed_by: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
