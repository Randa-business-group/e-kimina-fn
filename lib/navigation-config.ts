import {
  BarChart3,
  ArrowLeftRight,
  LayoutDashboard,
  Settings,
  Users,
  Users2,
  HandCoins,
  TrendingUp,
  CardSimIcon,
  Building2,
  ScrollText,
  SlidersHorizontal,
  UserX,
  LifeBuoy,
} from "lucide-react";
import { ROLE } from "@/types/enum";
import type { NavigationConfig } from "@/types/navigation";

export const navigationConfig: NavigationConfig = [
  {
    id: "main",
    label: "Main",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: [],
      },
      {
        id: "groups",
        label: "Groups",
        href: "/dashboard/groups",
        icon: Users2,
        roles: [ROLE.USER, ROLE.MEMBER, ROLE.GROUP_ADMIN, ROLE.TREASURER],
      },
      {
        id: "loans",
        label: "Loans",
        href: "/dashboard/loans",
        icon: HandCoins,
        roles: [ROLE.MEMBER, ROLE.GROUP_ADMIN, ROLE.TREASURER],
      },
      {
        id: "deposits",
        label: "Deposits",
        href: "/dashboard/deposits",
        icon: ArrowLeftRight,
        roles: [ROLE.MEMBER, ROLE.GROUP_ADMIN, ROLE.TREASURER],
      },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    items: [
      {
        id: "reports",
        label: "Reports",
        href: "/dashboard/financial",
        icon: BarChart3,
        roles: [ROLE.GROUP_ADMIN, ROLE.TREASURER],
      },
      {
        id: "loans-management",
        label: "Loans Management",
        href: "/dashboard/loans-management",
        icon: TrendingUp,
        roles: [ROLE.GROUP_ADMIN, ROLE.TREASURER],
      },
      {
        id: "manual-payments",
        label: "Manual Payments",
        href: "/dashboard/manual-payments",
        icon: CardSimIcon,
        roles: [ROLE.GROUP_ADMIN, ROLE.TREASURER],
      },
      {
        id: "users",
        label: "Users",
        href: "/dashboard/users",
        icon: Users,
        roles: [ROLE.SUPER_ADMIN],
      },
      {
        id: "admin-groups",
        label: "All groups",
        href: "/dashboard/admin/groups",
        icon: Building2,
        roles: [ROLE.SUPER_ADMIN],
      },
      {
        id: "audit-log",
        label: "Audit log",
        href: "/dashboard/admin/audit",
        icon: ScrollText,
        roles: [ROLE.SUPER_ADMIN],
      },
      {
        id: "platform",
        label: "Platform",
        href: "/dashboard/admin/platform",
        icon: SlidersHorizontal,
        roles: [ROLE.SUPER_ADMIN],
      },
      {
        id: "deletions",
        label: "Deletion requests",
        href: "/dashboard/admin/deletions",
        icon: UserX,
        roles: [ROLE.SUPER_ADMIN],
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        id: "settings",
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        roles: [],
      },
      {
        id: "help",
        label: "Help",
        href: "/dashboard/help",
        icon: LifeBuoy,
        roles: [],
      },
    ],
  },
];
