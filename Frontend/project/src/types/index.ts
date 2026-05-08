export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
}

export interface Patient {
  id: string;
  name: string;
  gender: string;
  age: number;
  dob: string;
  temperature: number;
  pulse: number;
  bloodPressure: string;
  height: number;
  weight: number;
  condition: string;
  description: string;
  symptoms: string;
  personalHistory: string;
  familyHistory: string;
  allergies: string;
  medications: string;
  reports: string;
  remarks: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}