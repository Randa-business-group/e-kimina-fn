"use client";

import { AnnouncementsPanel } from "@/components/notifications/announcements-panel";
import { CashBookTab, MatrixTab } from "@/components/reports/reports-page";
import { FinesTab, GroupLoansTab, InvitationsTab, LeaveTab, MeetingsTab } from "@/components/dashboard/groups/group-extra-tabs";
import { useT } from "@/lib/i18n/i18n-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InviteMemberDialog } from "@/components/dashboard/groups/invite-member-dialog";
import { getApiErrorMessage } from "@/lib/api/error-utils";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useContributionConfigQuery,
  useDeleteGroupMutation,
  useGroupMembersQuery,
  useGroupQuery,
  useLoanConfigQuery,
  useReactivateGroupMemberMutation,
  useRemoveGroupMemberMutation,
  useSuspendGroupMemberMutation,
  useUpdateGroupMutation,
} from "@/lib/query/groups-queries";
import { ApiError } from "@/lib/query/query-client";
import type { GroupMemberRow } from "@/types/group";
import { ROLE } from "@/types/enum";

import { DepositModal } from "./deposit-modal";
import { MyManualDepositPendingNotice } from "./my-manual-deposit-pending-notice";
import { PendingManualDepositsPanel } from "./pending-manual-deposits-panel";
import { GroupHeader } from "./Group-header";
import { RequestLoanModal } from "./request-loan-modal";
import { EditGroupDialog } from "./Edit-group-dialog";
import { DeleteGroupDialog } from "./Delete-group-dialog";
import { MemberActionDialog } from "./Member-action-dialog";
import { MembersTable } from "./Members-table";
import { SettingsTab } from "./Settings-tab";

type GroupDetailContentProps = {
  groupId: string;
};

type MemberAction = "remove" | "suspend" | null;

export function GroupDetailContent({ groupId }: GroupDetailContentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const groupQuery = useGroupQuery(groupId);
  const loanConfigQuery = useLoanConfigQuery(
    groupId,
    groupQuery.isSuccess && Boolean(groupQuery.data?.isVerified),
  );
  const contributionConfigQuery = useContributionConfigQuery(
    groupId,
    groupQuery.isSuccess && Boolean(groupQuery.data?.isVerified),
  );
  const membersQuery = useGroupMembersQuery(groupId, groupQuery.isSuccess);
  const updateMutation = useUpdateGroupMutation();
  const deleteMutation = useDeleteGroupMutation();
  const removeMutation = useRemoveGroupMemberMutation();
  const suspendMutation = useSuspendGroupMemberMutation();
  const reactivateMutation = useReactivateGroupMemberMutation();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [memberAction, setMemberAction] = useState<MemberAction>(null);
  const [actionTarget, setActionTarget] = useState<GroupMemberRow | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [requestLoanModalOpen, setRequestLoanModalOpen] = useState(false);

  const g = groupQuery.data;
  const isAdmin = g?.isGroupAdmin ?? false;
  const t = useT();
  const isLeaderHere = isAdmin || g?.myRole === ROLE.TREASURER;
  const isMemberHere = Boolean(g?.myRole);
  /** Only group admins get the settings tab; treasurers use other flows or API. */
  const canEditLoanConfig = Boolean(g && g.isVerified && g.isGroupAdmin);
  // ✅ CHANGED: show settings tab for any admin, not just when loan config is editable
  const showSettingsTab = isAdmin;

  const openEdit = () => {
    if (!g) return;
    setEditName(g.name);
    setEditDesc(g.description ?? "");
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!g) return;
    try {
      await updateMutation.mutateAsync({
        groupId,
        name: editName.trim(),
        description: editDesc.trim() || null,
      });
      toast.success("Group updated");
      setEditOpen(false);
    } catch (e) {
      toast.error(
        e instanceof ApiError || e instanceof Error
          ? getApiErrorMessage(e)
          : "Update failed",
      );
    }
  };

  const confirmDeleteGroup = async (v: { confirmName: string; reason?: string }) => {
    try {
      await deleteMutation.mutateAsync({ groupId, ...v });
      toast.success("Group deleted");
      router.push("/dashboard/groups");
      router.refresh();
    } catch (e) {
      toast.error(
        e instanceof ApiError || e instanceof Error
          ? getApiErrorMessage(e)
          : "Could not delete",
      );
    }
  };

  const submitMemberAction = async () => {
    if (!actionTarget || !memberAction) return;
    const reason = actionReason.trim();
    if (reason.length < 3) {
      toast.error("Reason must be at least 3 characters.");
      return;
    }
    try {
      if (memberAction === "remove") {
        await removeMutation.mutateAsync({
          groupId,
          memberUserId: actionTarget.userId,
          reason,
        });
        toast.success("Member removed from the group");
      } else {
        await suspendMutation.mutateAsync({
          groupId,
          memberUserId: actionTarget.userId,
          reason,
        });
        toast.success("Member suspended in this group");
      }
      setMemberAction(null);
      setActionTarget(null);
      setActionReason("");
    } catch (e) {
      toast.error(
        e instanceof ApiError || e instanceof Error
          ? getApiErrorMessage(e)
          : "Action failed",
      );
    }
  };

  const onReactivate = async (m: GroupMemberRow) => {
    try {
      await reactivateMutation.mutateAsync({ groupId, memberUserId: m.userId });
      toast.success("Member reactivated");
    } catch (e) {
      toast.error(
        e instanceof ApiError || e instanceof Error
          ? getApiErrorMessage(e)
          : "Failed",
      );
    }
  };

  if (groupQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-text-muted">
        <Loader2 className="size-5 animate-spin" />
        Loading group…
      </div>
    );
  }

  if (groupQuery.isError) {
    return (
      <div className="rounded-(--radius) border border-border bg-secondary px-4 py-6 text-center">
        <p className="font-medium text-text">Could not open this group</p>
        <p className="mt-2 text-sm text-text-muted">
          {groupQuery.error instanceof ApiError &&
          groupQuery.error.status === 403
            ? "You are not a member of this group or your access was suspended."
            : (groupQuery.error?.message ?? "Something went wrong.")}
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/dashboard/groups">Back to groups</Link>
        </Button>
      </div>
    );
  }

  if (!g) return null;

  const showFinanceDepositButton =
    g.isVerified &&
    contributionConfigQuery.isSuccess &&
    contributionConfigQuery.data != null;
  const showFinanceLoanButton =
    g.isVerified && loanConfigQuery.isSuccess && loanConfigQuery.data != null;
  const canReviewManualDeposits =
    g.isVerified &&
    (g.isGroupAdmin || g.myRole === ROLE.TREASURER);

  return (
    <div className="space-y-6">
      {/* Header */}
      <GroupHeader
        name={g.name}
        description={g.description}
        isVerified={g.isVerified}
        isPublic={g.isPublic}
        myRole={g.myRole}
        memberCount={g.memberCount ?? 0}
        maxMembers={g.maxMembers}
        createdAt={g.createdAt}
        isAdmin={isAdmin}
        onEdit={openEdit}
        onInvite={() => setInviteOpen(true)}
        onDelete={() => setDeleteOpen(true)}
        loanState={{
          isVerified: g.isVerified,
          isLoading: loanConfigQuery.isLoading,
          isError: loanConfigQuery.isError,
          errorMessage: loanConfigQuery.error?.message,
          config: loanConfigQuery.isSuccess
            ? (loanConfigQuery.data ?? null)
            : undefined,
        }}
        contributionState={{
          isVerified: g.isVerified,
          isLoading: contributionConfigQuery.isLoading,
          isError: contributionConfigQuery.isError,
          errorMessage: contributionConfigQuery.error?.message,
          config: contributionConfigQuery.isSuccess
            ? (contributionConfigQuery.data ?? null)
            : undefined,
        }}
        onOpenDepositModal={() => setDepositModalOpen(true)}
        onOpenRequestLoanModal={() => setRequestLoanModalOpen(true)}
        showDepositButton={showFinanceDepositButton}
        showLoanRequestButton={showFinanceLoanButton}
      />

      <MyManualDepositPendingNotice
        groupId={groupId}
        isGroupAdmin={isAdmin}
        isVerified={g.isVerified}
      />

      {canReviewManualDeposits && <PendingManualDepositsPanel groupId={groupId} />}

      <DepositModal
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
        groupId={groupId}
        isVerified={g.isVerified}
      />
      <RequestLoanModal
        open={requestLoanModalOpen}
        onOpenChange={setRequestLoanModalOpen}
        groupId={groupId}
        isVerified={g.isVerified}
      />

      {/* Tabs */}
      <Tabs defaultValue="members">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="members">{t("group.tab.members")}</TabsTrigger>
          <TabsTrigger value="announcements">{t("group.tab.announcements")}</TabsTrigger>
          {isLeaderHere ? <TabsTrigger value="contributions">{t("group.tab.contributions")}</TabsTrigger> : null}
          {isLeaderHere ? <TabsTrigger value="ledger">{t("group.tab.ledger")}</TabsTrigger> : null}
          {isMemberHere ? <TabsTrigger value="loans">{t("group.tab.loans")}</TabsTrigger> : null}
          {isMemberHere ? <TabsTrigger value="fines">{t("group.tab.fines")}</TabsTrigger> : null}
          {isMemberHere ? <TabsTrigger value="meetings">{t("group.tab.meetings")}</TabsTrigger> : null}
          {isAdmin ? <TabsTrigger value="invitations">{t("group.tab.invitations")}</TabsTrigger> : null}
          {isMemberHere ? <TabsTrigger value="leave">{t("group.tab.leave")}</TabsTrigger> : null}
          {/* ✅ CHANGED: tab label is now "Settings", condition uses showSettingsTab */}
          {showSettingsTab && (
            <TabsTrigger value="settings">{t("group.tab.settings")}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members" className="pt-4">
          <MembersTable
            members={membersQuery.data ?? []}
            isLoading={membersQuery.isLoading}
            isError={membersQuery.isError}
            errorMessage={membersQuery.error?.message}
            isAdmin={isAdmin}
            currentUserId={user?.id}
            createdById={g.createdById}
            reactivatePending={reactivateMutation.isPending}
            onSuspend={(m) => {
              setActionTarget(m);
              setMemberAction("suspend");
              setActionReason("");
            }}
            onRemove={(m) => {
              setActionTarget(m);
              setMemberAction("remove");
              setActionReason("");
            }}
            onReactivate={(m) => void onReactivate(m)}
          />
        </TabsContent>

        {isLeaderHere ? (
          <TabsContent value="contributions" className="pt-4">
            <MatrixTab groupId={groupId} range={{}} />
          </TabsContent>
        ) : null}
        {isLeaderHere ? (
          <TabsContent value="ledger" className="pt-4">
            <CashBookTab groupId={groupId} range={{}} />
          </TabsContent>
        ) : null}
        {isMemberHere ? (
          <>
            <TabsContent value="loans" className="pt-4">
              <GroupLoansTab groupId={groupId} isLeader={isLeaderHere} />
            </TabsContent>
            <TabsContent value="fines" className="pt-4">
              <FinesTab groupId={groupId} isLeader={isLeaderHere} myUserId={user?.id} />
            </TabsContent>
            <TabsContent value="meetings" className="pt-4">
              <MeetingsTab groupId={groupId} isLeader={isLeaderHere} />
            </TabsContent>
            <TabsContent value="leave" className="pt-4">
              <LeaveTab groupId={groupId} isLeader={isLeaderHere} myUserId={user?.id} />
            </TabsContent>
          </>
        ) : null}
        {isAdmin ? (
          <TabsContent value="invitations" className="pt-4">
            <InvitationsTab groupId={groupId} />
          </TabsContent>
        ) : null}

        <TabsContent value="announcements" className="pt-4">
          <AnnouncementsPanel groupId={groupId} canPost={isAdmin} />
        </TabsContent>

        {/* ✅ CHANGED: renders SettingsTab (holds both Contributions + Loans sections) */}
        {showSettingsTab && (
          <TabsContent value="settings" className="pt-4">
            <SettingsTab
              groupId={groupId}
              isVerified={g.isVerified}
              canEdit={canEditLoanConfig}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Dialogs — unchanged */}
      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        groupId={groupId}
        groupName={g.name}
      />

      <EditGroupDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editName={editName}
        editDesc={editDesc}
        onNameChange={setEditName}
        onDescChange={setEditDesc}
        onSave={() => void saveEdit()}
        isPending={updateMutation.isPending}
      />

      <DeleteGroupDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={(v) => void confirmDeleteGroup(v)}
        isPending={deleteMutation.isPending}
        groupName={g?.name ?? ""}
      />

      <MemberActionDialog
        open={Boolean(memberAction && actionTarget)}
        memberAction={memberAction}
        actionTarget={actionTarget}
        actionReason={actionReason}
        onReasonChange={setActionReason}
        onConfirm={() => void submitMemberAction()}
        onCancel={() => {
          setMemberAction(null);
          setActionTarget(null);
          setActionReason("");
        }}
        isPending={removeMutation.isPending || suspendMutation.isPending}
      />
    </div>
  );
}
