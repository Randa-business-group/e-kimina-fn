export type DepositPaymentMethodApi = "MTN_MOMO" | "MANUAL_TRANSFER";

export type DepositPreviewResponse = {
  configured: boolean;
  message?: string;
  currency?: string;
  allowPartialPayments?: boolean;
  contribution?: number;
  fine?: number;
  installment?: number;
  total?: number;
  /** Nothing is owed: the amount pays the next period in advance. */
  isAdvancePayment?: boolean;
  /** The member's open loan (can be paid together with the contribution). */
  loan?: {
    memberLoanId: string;
    status: string;
    dueDate: string;
    isOverdue: boolean;
    penalty: number;
    balance: number;
    outstanding: number;
    included: boolean;
  } | null;
};

export type LoanRequestPreviewResponse = {
  configured: boolean;
  message?: string;
  canRequest?: boolean;
  currency?: string;
  maxAmount?: number;
  minAmount?: number;
  totalContributed?: number;
  interestRate?: number;
  repaymentPeriodDays?: number;
  allowExceedContribution?: boolean;
  /** Reasons the member cannot apply right now (arrears, open loan, no group cash…). */
  blockers?: string[];
  groupCashAvailable?: number;
  stakeCap?: number | null;
  lateContributions?: number;
  openFines?: number;
};

export type CreateDepositBody = {
  amount: number;
  paymentMethod: DepositPaymentMethodApi;
  phone?: string;
  /** Set for MANUAL_TRANSFER after uploading via POST /upload. */
  proofImageUrl?: string;
  /** When repaying a disbursed member loan, pass its id (same payment methods as a deposit). */
  memberLoanId?: string;
  /** Pay contributions/fines and the open loan in one deposit. */
  includeLoanRepayment?: boolean;
  /** Client-generated key so a retried submit never creates a second payment. */
  idempotencyKey?: string;
};

export type PendingManualDeposit = {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: DepositPaymentMethodApi;
  proofImageUrl: string;
  createdAt: string;
  member: { id: string; fullName: string; email: string };
  /** The reviewer's own payment — another leader must review it. */
  isOwn?: boolean;
  canReview?: boolean;
};

/** Current user’s own manual transfer(s) awaiting group admin (read-only in UI). */
export type MyPendingManualDeposit = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type CreateDepositResult = {
  id: string;
  message: string;
  amount: number;
  currency: string;
  /** PENDING (MoMo prompt sent) · PENDING_VERIFICATION · CONFIRMED · FAILED */
  status: string;
  failureReason?: string | null;
};

export type DepositStatusResult = CreateDepositResult & {
  paymentMethod: DepositPaymentMethodApi;
  contributionPortion: number;
  finePortion: number;
  installmentPortion: number;
};

export type CreateLoanApplicationResult = {
  id: string;
  status: string;
  requestedAmount: number;
  message: string;
};
