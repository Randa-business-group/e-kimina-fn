/** Response shapes of the super-admin API (msfts §6). */

export type Paged<T> = { page: number; pageSize: number; total: number; totalPages: number; items: T[] };

export type AdminUserStatus = "ACTIVE" | "SUSPENDED" | "PENDING_INVITE" | "LOCKED" | "UNVERIFIED";

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  image: string | null;
  isActive: boolean;
  emailVerified: boolean;
  suspendedAt: string | null;
  suspensionReason: string | null;
  lockedUntil: string | null;
  failedLoginAttempts: number;
  lastLoginAt: string | null;
  createdAt: string;
  platformRole: "USER" | "SUPER_ADMIN";
  groups: number;
  status: AdminUserStatus;
};

export type AdminUsersPage = Paged<AdminUser> & {
  counts: { all: number; suspended: number; pending: number; unverified: number; locked: number };
};

export type AuditRow = {
  id: string;
  createdAt: string;
  action: string;
  actorId: string | null;
  actorName: string | null;
  actorRole?: string | null;
  impersonatorId?: string | null;
  method?: string | null;
  path?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  groupId: string | null;
  groupName?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
  statusCode?: number | null;
};

export type AdminUserDetail = AdminUser & {
  memberships: {
    groupId: string;
    groupName: string;
    groupDeleted: boolean;
    groupVerification: string;
    role: string;
    membershipStatus: string;
    joinedAt: string;
  }[];
  money: { confirmedDeposits: number; depositedTotal: number; openLoans: number };
  recentActivity: AuditRow[];
};

export type AdminGroup = {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: string;
  maxMembers: number;
  verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  verificationRequestedAt: string | null;
  verificationRejectionReason: string | null;
  deletedAt: string | null;
  deletionReason: string | null;
  createdBy: { id: string; fullName: string; email: string };
  members: number;
  hasPaymentAccount: boolean;
  savingsBalance: number;
  socialBalance: number;
};

export type AdminGroupsPage = Paged<AdminGroup> & { counts: Record<string, number> };

export type PaymentAccount = {
  provider: string;
  accountName: string | null;
  msisdn: string | null;
  isActive: boolean;
  collection: { userId: string | null; apiKey: string | null; subscriptionKey: string | null; configured: boolean };
  disbursement: { userId: string | null; apiKey: string | null; subscriptionKey: string | null; configured: boolean };
  updatedAt: string;
};

export type AdminGroupDetail = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  createdBy: { id: string; fullName: string; email: string; phoneNumber: string | null };
  maxMembers: number;
  minMembers: number;
  verification: {
    status: AdminGroup["verificationStatus"];
    requestedAt: string | null;
    details: Record<string, unknown> | null;
    reviewedAt: string | null;
    reviewedBy: string | null;
    rejectionReason: string | null;
  };
  deletedAt: string | null;
  deletionReason: string | null;
  contribution: { amount: number; currency: string; interval: string } | null;
  members: Record<string, number>;
  leaders: { role: string; id: string; fullName: string; email: string; phoneNumber: string | null }[];
  loans: { active: number; defaulted: number; repaid: number };
  balances: { savings: number; social: number };
  paymentAccount: PaymentAccount | null;
  recentActivity: AuditRow[];
};

export type PlatformSettings = {
  supportedCurrencies: string[];
  defaultCurrency: string;
  collectionMode: "PLATFORM" | "PER_GROUP";
  platformAccountName: string | null;
  platformAccountMsisdn: string | null;
  feeMode: "NONE" | "PERCENT" | "FLAT";
  feeValue: number;
  feeMin: number | null;
  feeMax: number | null;
  signupsEnabled: boolean;
  requireLeaderTwoFactor: boolean;
  supportEmail: string | null;
  updatedAt: string;
  updatedById: string | null;
};

export type PlatformMetrics = {
  asOf: string;
  groups: { live: number; verified: number; pendingVerification: number; unverified: number; rejected: number; deleted: number };
  users: { total: number; active: number; emailVerified: number; activeMemberships: number; suspended?: number; locked?: number };
  money: {
    depositVolumeAllTime: number;
    depositCountAllTime: number;
    platformFeesCollected?: number;
    loansOutstanding: number;
    openLoans: number;
    par30Percent: number;
    loansDisbursedInWindow: number;
  };
  series: {
    month: string;
    depositVolume: number;
    depositCount: number;
    momoVolume: number;
    manualVolume: number;
    loansDisbursed: number;
    newUsers: number;
    newGroups: number;
  }[];
  topGroups: { id: string; name: string; deposits: number; volume: number }[];
};

export type ImpersonationResponse = {
  accessToken: string;
  readOnly: true;
  expiresAt: string;
  user: { id: string; fullName: string; email: string };
};
