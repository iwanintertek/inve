import { z } from 'zod';

export const CategoryEnum = z.enum([
  'Chemical',
  'Biological',
  'Glassware',
  'Consumable',
  'Equipment',
  'Other'
]);

export const HazardEnum = z.enum([
  'none',
  'flammable',
  'corrosive',
  'toxic',
  'oxidizing',
  'biohazard'
]);

export const TransactionTypeEnum = z.enum(['IN', 'OUT', 'ADJUSTMENT']);

export const itemSchema = z.object({
  code: z.string().min(2, 'Item code must be at least 2 characters').max(50),
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  category: CategoryEnum,
  cas_number: z.string().optional().nullable(),
  unit: z.string().min(1, 'Unit is required').max(50),
  current_stock: z.coerce.number().min(0, 'Stock cannot be negative'),
  minimum_stock: z.coerce.number().min(0, 'Minimum stock cannot be negative'),
  location: z.string().min(2, 'Location is required').max(100),
  batch_number: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  hazard_classification: HazardEnum.default('none'),
  document_url: z.string().optional().nullable(),
  document_name: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const itemUpdateSchema = itemSchema.partial().extend({
  id: z.coerce.number().positive(),
});

export const stockTransactionSchema = z.object({
  item_id: z.coerce.number().positive('Valid item ID is required'),
  transaction_type: TransactionTypeEnum,
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  purpose: z.string().max(255).optional().nullable(),
  performed_by: z.string().min(2, 'Staff/Analyst name is required').max(100),
  notes: z.string().optional().nullable(),
});

export type ItemInput = z.infer<typeof itemSchema>;
export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;
export type StockTransactionInput = z.infer<typeof stockTransactionSchema>;
