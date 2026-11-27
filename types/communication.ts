/** Notifications & communication API shapes (msfts §7). */

export type Channel = "IN_APP" | "EMAIL" | "SMS" | "PUSH";

export type NotificationPreferences = {
  channels: {
    IN_APP: { available: boolean; reason: string | null };
    EMAIL: { available: boolean; reason: string | null; address: string };
    SMS: { available: boolean; reason: string | null; phone: string | null };
    PUSH: { available: boolean; reason: string | null; devices: number };
  };
  categories: {
    key: string;
    label: string;
    description: string;
    settings: Record<Channel, { enabled: boolean; isDefault: boolean }>;
  }[];
};

export type Announcement = {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string | null;
  title: string;
  body: string;
  channels: Channel[];
  pinned: boolean;
  recipients: number;
  createdAt: string;
};

export type SmsLogRow = {
  id: string;
  createdAt: string;
  userId: string | null;
  groupId: string | null;
  to: string;
  message: string;
  kind: string;
  provider: string;
  status: "SENT" | "FAILED" | "SKIPPED";
  segments: number;
  providerMessageId: string | null;
  error: string | null;
};

export type SmsLogPage = {
  provider: string;
  last30Days: Partial<Record<"SENT" | "FAILED" | "SKIPPED", number>> & { segments: number };
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: SmsLogRow[];
};
