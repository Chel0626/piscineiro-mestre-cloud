import { ClientFormData } from '../validators/clientSchema';

export const mapClientFromDB = (data: any): ClientFormData & { id: string; active: boolean; tenant_id?: string; lastPaymentDate?: string; paymentStatus?: string } => {
  console.log('Mapeando cliente do DB:', { id: data.id, pool_volume: data.pool_volume, poolVolume: data.pool_volume });
  return {
    id: data.id,
    tenant_id: data.tenant_id,
    name: data.name,
    address: data.address || '',
    neighborhood: data.neighborhood || '',
    phone: data.phone || '',
    email: data.email || '',
    poolVolume: Number(data.pool_volume) || 0,
    serviceValue: Number(data.service_value) || 0,
    visitFrequency: data.visit_frequency || 'weekly',
    visitDay: data.visit_day || '',
    visitDays: Array.isArray(data.visit_days) && data.visit_days.length > 0 
      ? data.visit_days 
      : (data.visit_day ? [data.visit_day] : []),
    filterModel: data.filter_model || '',
    filterSandKg: data.filter_sand_kg ? Number(data.filter_sand_kg) : undefined,
    lastSandChange: data.last_sand_change || undefined,
    nextSandChange: data.next_sand_change || undefined,
    contractStartDate: data.contract_start_date || undefined,
    
    // Novos campos mapeados do Banco para o Front
    planType: data.plan_type || 'mensal',
    nextRenewalDate: data.next_renewal_date || undefined,

    paymentDueDate: data.payment_due_date || 10,
    type: data.type || 'residential',
    coordinates: data.coordinates || undefined,
    active: data.active !== false,
    lastPaymentDate: data.last_payment_date || undefined,
    paymentStatus: data.payment_status || undefined,
    chlorineType: data.chlorine_type || undefined,
    peroxideStartDate: data.peroxide_start_date || undefined,
    workerId: data.worker_id || undefined,
  };
};

export const mapClientToDB = (data: ClientFormData, userId: string) => ({
  name: data.name,
  worker_id: data.workerId || null,
  address: data.address,
  neighborhood: data.neighborhood,
  phone: data.phone,
  email: data.email,
  pool_volume: data.poolVolume,
  service_value: data.serviceValue,
  visit_frequency: data.visitFrequency,
  visit_days: data.visitDays,
  filter_model: data.filterModel,
  filter_sand_kg: data.filterSandKg,
  last_sand_change: data.lastSandChange,
  next_sand_change: data.nextSandChange,
  contract_start_date: data.contractStartDate,
  
  // Novos campos mapeados do Front para o Banco
  plan_type: data.planType || null,
  next_renewal_date: data.nextRenewalDate || null,

  payment_due_date: data.paymentDueDate,
  type: data.type,
  coordinates: data.coordinates,
  chlorine_type: data.chlorineType || null,
  peroxide_start_date: data.peroxideStartDate || null,
});

export const mapVisitFromDB = (data: any) => ({
  id: data.id,
  date: data.date,
  ph: Number(data.ph),
  cloro: Number(data.chlorine),
  alcalinidade: Number(data.alkalinity),
  chlorineType: data.chlorine_type,
  waterCondition: data.water_condition,
  notes: data.description,
  productsUsed: data.products_used,
  imageUrl: data.image_url,
  timestamp: data.created_at || data.date,
});

export const mapVisitToDB = (data: any, clientId: string, userId: string) => ({
  client_id: clientId,
  user_id: userId,
  date: data.date,
  ph: data.ph,
  chlorine: data.chlorine,
  alkalinity: data.alkalinity,
  chlorine_type: data.chlorineType,
  water_condition: data.waterCondition,
  description: data.notes,
  products_used: data.productsUsed,
  image_url: data.imageUrl,
});