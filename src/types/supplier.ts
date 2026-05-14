export interface Supplier {
  id: number;
  name: string;
  contactEmail: string;
  contactPhone: string;
  leadTimeDays: number;
  orderingCost: number;
  isActive: boolean;
}

export interface SupplierForm {
  name: string;
  contactEmail: string;
  contactPhone: string;
  leadTimeDays: number;
  orderingCost: number;
}