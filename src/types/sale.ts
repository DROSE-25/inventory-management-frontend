export interface Sale {
  id: number;
  saleDate: string;
  quantity: number;
  unitPrice: number;
  unitOfMeasure?: string;
  createdAt: string;
  createdBy: string;
  product: {
    id: number;
    name: string;
    sku: string;
    unitOfMeasure?: string;
  };
  warehouse: {
    id: number;
    name: string;
  };
}

export interface SaleForm {
  productId: number;
  warehouseId: number;
  quantity: number;
  unitPrice: number;
  saleDate: string;
}