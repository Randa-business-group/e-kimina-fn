/** Response shapes of the reports API (msfts §5). */

export type Period = { from: string; to: string };

export type MonthlyPoint = {
  month: string;
  savingsIn: number;
  socialIn: number;
  loansOut: number;
  repaymentsIn: number;
  income: number;
  expensesOut: number;
  cashBalance: number;
  socialBalance: number;
  loansOutstanding: number;
  mySavings: number;
};

export type GroupDashboardReport = {
  group: string;
  months: string[];
  series: MonthlyPoint[];
  kpis: {
    members: number;
    cash: number;
    socialFund: number;
    availableForLoans: number;
    loansOutstanding: number;
    mySavings: number;
  };
};

export type UpcomingItem = {
  id: string;
  groupId: string;
  groupName: string;
  type: string;
  amount: number;
  currency: string;
  dueDate: string;
  description: string;
  status: string;
};

export type HistoryItem = {
  id: string;
  groupId: string;
  groupName: string;
  type: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  isCredit: boolean;
};

export type UserDashboard = {
  user: { fullName: string; email: string };
  totals: {
    groups: number;
    savings: number;
    socialFund: number;
    loanOutstanding: number;
    openFines: number;
    overdue: number;
    dueNext30Days: number;
  };
  groups: {
    id: string;
    name: string;
    role: string;
    isVerified: boolean;
    memberCount: number;
    mySavings: number;
    socialFund: number;
    loanOutstanding: number;
    openFines: number;
    arrears: number;
    nextDue: { amount: number; dueDate: string; description: string; status: string } | null;
  }[];
  upcoming: UpcomingItem[];
  recent: HistoryItem[];
  savingsSeries: { month: string; saved: number; total: number }[];
  meetings: { id: string; groupId: string; groupName: string; title: string; scheduledAt: string; location: string | null }[];
};

export type MemberStatementReport = {
  group: string;
  member: { userId: string; name: string; email: string; phone: string | null; status: string };
  period: Period;
  summary: {
    openingSavings: number;
    savingsInPeriod: number;
    closingSavings: number;
    socialFundInPeriod: number;
    finesPaidInPeriod: number;
    loanRepaidInPeriod: number;
    openFines: number;
    loanOutstanding: number;
    lateContributions: number;
  };
  lines: { date: string; type: string; label: string; fund: string; direction: "IN" | "OUT"; amount: number; description: string | null }[];
  contributions: { dueDate: string; fund: string; amount: number; amountPaid: number; status: string }[];
  loans: { id: string; disbursedAt: string; dueDate: string; principal: number; totalRepayable: number; repaid: number; outstanding: number; status: string }[];
  fines: { date: string; type: string; reason: string; amount: number; status: string }[];
};

export type MatrixCell = { status: string; amount: number; amountPaid: number } | null;
export type ContributionMatrixReport = {
  group: string;
  fund: string;
  period: Period;
  periods: string[];
  members: {
    userId: string;
    name: string;
    membershipStatus: string;
    cells: MatrixCell[];
    paid: number;
    late: number;
    partial: number;
    pending: number;
    amountPaid: number;
    amountDue: number;
  }[];
  periodTotals: { dueDate: string; expected: number; collected: number; paidCount: number; lateCount: number }[];
  totals: { expected: number; collected: number };
};

export type ArrearsReport = {
  group: string;
  asOf: string;
  members: {
    userId: string;
    name: string;
    phone: string | null;
    membershipStatus: string;
    lateContributions: number;
    lateAmount: number;
    oldestLateDueDate: string | null;
    openFines: number;
    overdueLoanAmount: number;
    daysOverdue: number;
    defaulted: boolean;
    calledGuarantees: number;
    total: number;
  }[];
  totals: { members: number; defaulters: number; lateAmount: number; openFines: number; overdueLoanAmount: number; total: number };
};

export type LoanPortfolioReport = {
  group: string;
  asOf: string;
  period: Period;
  counts: { active: number; defaulted: number; repaid: number; writtenOff: number; overdue: number };
  portfolio: {
    principalOutstanding: number;
    totalOutstanding: number;
    par30: { amount: number; percent: number };
    par60: { amount: number; percent: number };
    par90: { amount: number; percent: number };
  };
  buckets: { bucket: string; loans: number; principalOutstanding: number }[];
  periodFlows: {
    disbursedCount: number;
    disbursedAmount: number;
    principalRepaid: number;
    interestEarned: number;
    penaltiesEarned: number;
    writtenOff: number;
  };
  loans: {
    id: string;
    borrower: string;
    disbursedAt: string;
    dueDate: string;
    principal: number;
    principalOutstanding: number;
    outstanding: number;
    penalty: number;
    status: string;
    daysOverdue: number;
    bucket: string;
  }[];
};

export type CashBookReport = {
  group: string;
  fund: string;
  period: Period;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  lines: {
    date: string;
    fund: string;
    type: string;
    label: string;
    member: string | null;
    description: string | null;
    in: number;
    out: number;
    balance: number;
    reference: string;
  }[];
};

export type ShareOutReport = {
  group: string;
  cycle: { id: string; name: string; startDate: string; endDate: string; status: string };
  final: boolean;
  totals: Record<string, number> | null;
  lines: {
    userId: string;
    fullName: string;
    openingBalance: number;
    savings: number;
    profitShare: number;
    grossAmount: number;
    fineDeduction: number;
    loanDeduction: number;
    netPayout: number;
    status?: string;
  }[];
};
