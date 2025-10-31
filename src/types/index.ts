// src/types/index.ts

export interface Admin {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  created_at: Date;
}

export interface Event {
  id: number;
  admin_id: number;
  name: string;
  location?: string;
  event_date?: Date;
  created_at: Date;
}

export interface Team {
  id: number;
  event_id: number;
  name: string;
  responsible_name?: string;
  responsible_email?: string;
  team_code: string;
  created_at: Date;
}

export interface Position {
  id: number;
  team_id: number;
  name: string;
  created_at: Date;
}

export interface Field {
  id: number;
  key: string;
  label: string;
  field_type: string;
  created_at: Date;
}

export interface PositionRequiredField {
  id: number;
  position_id: number;
  field_id: number;
  required: boolean;
}

export interface Staff {
  id: number;
  team_id: number;
  position_id: number;
  name?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  address?: string;
  car_plate?: string;
  created_at: Date;
}

// DTOs para requests
export interface CreateAdminDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface CreateEventDTO {
  name: string;
  location?: string;
  event_date?: string;
}

export interface CreateTeamDTO {
  event_id: number;
  name: string;
  responsible_name?: string;
  responsible_email?: string;
}

export interface CreatePositionDTO {
  team_id: number;
  name: string;
  required_fields?: { field_id: number; required: boolean }[];
}

export interface CreateStaffDTO {
  team_id: number;
  position_id: number;
  name?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  address?: string;
  car_plate?: string;
}

// JWT Payload
export interface JWTPayload {
  adminId: number;
  email: string;
  iat?: number;
  exp?: number;
}
