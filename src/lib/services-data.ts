import {
  Globe,
  Rocket,
  AppWindow,
  Users,
  ShoppingCart,
  Send,
  Contact,
  GitBranch,
  Bot,
  ClipboardList,
  BarChart3,
  Cloud,
  GitMerge,
  ShieldAlert,
  Network,
  MessageSquare,
  Mail,
  Headphones,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type ServiceItemId =
  | "websites"
  | "landingPages"
  | "webApplications"
  | "clientPortals"
  | "onlineStores"
  | "telegramBots"
  | "crmIntegration"
  | "workflowAutomation"
  | "aiChatbots"
  | "processConsulting"
  | "dataDashboards"
  | "cloudHosting"
  | "devopsCicd"
  | "securityMonitoring"
  | "scalableArchitecture"
  | "messagingBots"
  | "emailMarketing"
  | "customerSupport"
  | "internalTools";

export type ServiceCategoryId =
  | "digitalProducts"
  | "businessAutomation"
  | "infrastructure"
  | "communication";

export const serviceIcons: Record<ServiceItemId, LucideIcon> = {
  websites: Globe,
  landingPages: Rocket,
  webApplications: AppWindow,
  clientPortals: Users,
  onlineStores: ShoppingCart,
  telegramBots: Send,
  crmIntegration: Contact,
  workflowAutomation: GitBranch,
  aiChatbots: Bot,
  processConsulting: ClipboardList,
  dataDashboards: BarChart3,
  cloudHosting: Cloud,
  devopsCicd: GitMerge,
  securityMonitoring: ShieldAlert,
  scalableArchitecture: Network,
  messagingBots: MessageSquare,
  emailMarketing: Mail,
  customerSupport: Headphones,
  internalTools: Wrench,
};

export const serviceCategories: {
  id: ServiceCategoryId;
  image: string;
  items: ServiceItemId[];
}[] = [
  {
    id: "digitalProducts",
    image: "/images/services-digital-products.png",
    items: [
      "websites",
      "landingPages",
      "webApplications",
      "clientPortals",
      "onlineStores",
      "telegramBots",
    ],
  },
  {
    id: "businessAutomation",
    image: "/images/services-business-automation.png",
    items: [
      "crmIntegration",
      "workflowAutomation",
      "aiChatbots",
      "processConsulting",
      "dataDashboards",
    ],
  },
  {
    id: "infrastructure",
    image: "/images/services-infrastructure.png",
    items: ["cloudHosting", "devopsCicd", "securityMonitoring", "scalableArchitecture"],
  },
  {
    id: "communication",
    image: "/images/services-communication.png",
    items: ["messagingBots", "emailMarketing", "customerSupport", "internalTools"],
  },
];

/** Asymmetric grid span pattern applied by index, cycling for longer lists.
 *  Column-only spans keep the layout safe across breakpoints (no orphaned
 *  row tracks when the grid collapses to fewer columns on mobile). */
export const cardSpanPattern: { col: number; row: number }[] = [
  { col: 2, row: 1 },
  { col: 1, row: 1 },
  { col: 1, row: 1 },
  { col: 1, row: 1 },
  { col: 1, row: 1 },
  { col: 1, row: 1 },
];
