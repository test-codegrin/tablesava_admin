// src/components/icons.ts
// Centralized Iconify icon definitions for the entire project

import { Icon } from "@iconify/react";
export { Icon };

export const ICONS = {
  // ─── Sidebar Navigation ─────────────────────────────────────────
  dashboard:        "ic:outline-dashboard",
  forkspoon:     "icon-park-twotone:fork-spoon",
  tableMgmt:        "icon-park-twotone:table",
  qrCode:           "mdi:qrcode",
  inventory:        "mdi:package-variant-closed",
  payments:         "mdi:credit-card-outline",
  liveOrders:       "mdi:receipt-clock-outline",

  // ─── Sidebar Controls ────────────────────────────────────────────
  chevronLeft:      "mdi:chevron-left",
  chevronRight:     "mdi:chevron-right",
  logout:           "mdi:logout",

  // ─── Top Bar / Profile ───────────────────────────────────────────
  account:          "mdi:account",
  moon:             "stash:moon-solid",
  question:         "mdi:help-circle-outline",
  setting:          "lets-icons:setting-line",

  // ─── Coming Soon ─────────────────────────────────────────────────
  rocketLaunch:     "mdi:rocket-launch-outline",

  // ─── Auth — Form Fields ──────────────────────────────────────────
  store:            "mdi:store-outline",
  web:              "mdi:web",
  email:            "mdi:email-outline",
  lock:             "mdi:lock-outline",
  eyeOn:            "mdi:eye-outline",
  eyeOff:           "mdi:eye-off-outline",

  // ─── Auth — Actions ──────────────────────────────────────────────
  arrowRight:       "mdi:arrow-right",
  //dashboard icon for category management
  delete:          "mdi:delete-outline",
} as const;

export type IconKey = keyof typeof ICONS;