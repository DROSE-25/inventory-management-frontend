export interface Warehouse {
  id: number;
  name: string;
  address: string;
  capacity: number;
  isActive: boolean;
}

export interface WarehouseForm {
  name: string;
  address: string;
  capacity: number;
}