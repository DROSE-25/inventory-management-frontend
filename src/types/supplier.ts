export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  leadTimeDays: number;
  minOrderAmount: number;
  isActive: boolean;
}

export interface SupplierForm {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  leadTimeDays: number;
  minOrderAmount: number;
}