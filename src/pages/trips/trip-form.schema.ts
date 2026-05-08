import { z } from 'zod';

export const tripCreateMinimalSchema = z.object({
  scheduled_date: z.coerce.string().trim().min(1),
  route_template_id: z.coerce.number().int().positive(),
});

export type TripCreateMinimalInput = z.infer<typeof tripCreateMinimalSchema>;
