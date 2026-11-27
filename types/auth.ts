import type { Role } from "./enum";

export type { Role, RoleName } from "./enum";

export interface GroupMembership {
  groupId: string;
  groupName: string;
  role: Role;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  image: string | null;
  emailVerified: boolean;
  /** Set once the phone number was confirmed with an SMS code. */
  phoneVerifiedAt?: string | null;
  /** Two-step verification method, when on. */
  twoFactorMethod?: "TOTP" | "SMS" | null;
  platformRole: Role;
  groupMemberships: GroupMembership[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** Password was right; a second step is needed (msfts §8). */
export interface TwoFactorChallenge {
  twoFactorRequired: true;
  method: "TOTP" | "SMS";
  challengeToken: string;
  phoneHint: string | null;
}

export type LoginResult = AuthResponse | TwoFactorChallenge;

export const isChallenge = (r: LoginResult): r is TwoFactorChallenge =>
  (r as TwoFactorChallenge).twoFactorRequired === true;

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  image?: string;
  /** Completes a pending treasurer account created when a group admin invites by email. */
  invitationToken?: string;
}

/** Normal registration — verify email with OTP before using the app. */
export interface RegisterPendingResponse {
  needsEmailVerification: true;
  email: string;
  message?: string;
}

export type RegisterResult = AuthResponse | RegisterPendingResponse;

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyResetOtpRequest {
  email: string;
  otp: string;
}

export interface CompletePasswordResetRequest {
  resetToken: string;
  password: string;
}
