export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export type SocialLoginRequest = {
  provider: 'google' | 'facebook' | 'apple';
  access_token?: string;
  id_token?: string;
};

export type ResetPasswordRequest = {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
};

export type ChangePasswordRequest = {
  current_password: string;
  new_password: string;
  password_confirmation: string;
};
