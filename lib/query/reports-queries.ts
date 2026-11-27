import { useQuery } from "@tanstack/react-query";
import {
  fetchArrears,
  fetchCashBook,
  fetchCycles,
  fetchGroupDashboard,
  fetchMatrix,
  fetchPortfolio,
  fetchShareOut,
  fetchStatement,
  fetchUserDashboard,
  type ReportRange,
} from "@/lib/api/reports-api";

const k = (...parts: (string | undefined)[]) => ["reports", ...parts.map((p) => p ?? "")] as const;

export const useUserDashboardQuery = () =>
  useQuery({ queryKey: k("user-dashboard"), queryFn: fetchUserDashboard });

export const useGroupDashboardQuery = (groupId: string) =>
  useQuery({ queryKey: k("group-dashboard", groupId), queryFn: () => fetchGroupDashboard(groupId), enabled: Boolean(groupId) });

export const useStatementQuery = (groupId: string, r: ReportRange) =>
  useQuery({ queryKey: k("statement", groupId, r.from, r.to), queryFn: () => fetchStatement(groupId, r), enabled: Boolean(groupId) });

export const useMatrixQuery = (groupId: string, r: ReportRange & { fund?: string }, enabled = true) =>
  useQuery({
    queryKey: k("matrix", groupId, r.from, r.to, r.fund),
    queryFn: () => fetchMatrix(groupId, r),
    enabled: Boolean(groupId) && enabled,
  });

export const useArrearsQuery = (groupId: string, enabled = true) =>
  useQuery({ queryKey: k("arrears", groupId), queryFn: () => fetchArrears(groupId), enabled: Boolean(groupId) && enabled });

export const usePortfolioQuery = (groupId: string, r: ReportRange, enabled = true) =>
  useQuery({
    queryKey: k("portfolio", groupId, r.from, r.to),
    queryFn: () => fetchPortfolio(groupId, r),
    enabled: Boolean(groupId) && enabled,
  });

export const useCashBookQuery = (groupId: string, r: ReportRange & { fund?: string }, enabled = true) =>
  useQuery({
    queryKey: k("cash-book", groupId, r.from, r.to, r.fund),
    queryFn: () => fetchCashBook(groupId, r),
    enabled: Boolean(groupId) && enabled,
  });

export const useCyclesQuery = (groupId: string) =>
  useQuery({ queryKey: k("cycles", groupId), queryFn: () => fetchCycles(groupId), enabled: Boolean(groupId) });

export const useShareOutQuery = (groupId: string, cycleId: string) =>
  useQuery({
    queryKey: k("share-out", groupId, cycleId),
    queryFn: () => fetchShareOut(groupId, cycleId),
    enabled: Boolean(groupId && cycleId),
  });
