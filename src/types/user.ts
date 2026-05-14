export interface AppUser {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserForm {
  username: string;
  email: string;
  password: string;
  role: string;
}