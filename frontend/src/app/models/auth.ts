export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  name: string;
}

export interface ProfileResponse {
  id: string;
  name: string;
  login: string;
  email: string;
}

export interface UpdateProfileRequest {
  name?: string;
  login?: string;
  password?: string;
}











