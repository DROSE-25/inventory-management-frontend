export interface Supplier {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  unitPrice: number;
  unitOfMeasure: string;
  orderingCost: number;
  isActive: boolean;
  supplier: Supplier;
}

export interface ProductForm {
  name: string;
  sku: string;
  unitPrice: number;
  unitOfMeasure: string;
  orderingCost: number;
  supplierId: number;
}

// Бекенд повертає Page<T>
export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number; // поточна сторінка (0-based)
  size: number;
}