export interface Plan {
  id: string;
  name: string;
  description: string;
  frequency: 'weekly' | 'biweekly' | 'single';
  visitsPerWeek: number;
  basePrice: number;
  features: string[];
  active: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}
