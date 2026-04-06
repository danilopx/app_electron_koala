export interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  jti?: string;
  error?: string;
  error_description?: string;
  login?: string;
}

export interface PasswordChangeRequest {
  user: string;
  oldPassword: string;
  newPassword: string;
}

export interface PasswordChangeRequiredError {
  code: 'PASSWORD_CHANGE_REQUIRED';
  message: string;
  user: string;
  oldPassword: string;
  location?: string;
  status?: number;
}
