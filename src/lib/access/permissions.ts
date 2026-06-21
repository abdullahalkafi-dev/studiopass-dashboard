/**
 * Role-Based Access Control — Permissions Config
 *
 * Maps (role) → per-resource field/column/action visibility.
 * This is the single source of truth for what each role can see/do.
 *
 * SCOPE LEVELS (independent of role hierarchy):
 *   super_admin    → global, sees everything
 *   partner_admin  → scoped to one partnerId
 *   customer_care  → scoped to one partnerId, narrower permissions than partner_admin
 *   station_admin  → scoped to one stationId
 *   media_station  → scoped to same stationId as parent station_admin
 *   presenter      → scoped to same stationId as parent station_admin
 */

export type Role =
  | "super_admin"
  | "partner_admin"
  | "station_admin"
  | "media_station"
  | "presenter"
  | "customer_care";

export type Action = "view" | "create" | "edit" | "delete";

export type FieldVisibility = "visible" | "hidden" | "readonly";

export interface ResourcePermissions {
  /** Which actions this role can perform on this resource */
  actions: Action[];
  /** Per-field visibility for table columns / form fields */
  fields: Record<string, FieldVisibility>;
}

export type PermissionsConfig = Record<Role, Record<string, ResourcePermissions>>;

// ─── Config ───────────────────────────────────────────────────────────────────

export const PERMISSIONS: PermissionsConfig = {
  super_admin: {
    stations: {
      actions: ["view", "create", "edit", "delete"],
      fields: {
        id: "visible",
        name: "visible",
        country: "visible",
        partner: "visible",
        stationAdmin: "visible",
        category: "visible",
        mediaStations: "visible",
        activeShows: "visible",
        status: "visible",
        created: "visible",
        description: "visible",
      },
    },
    users: {
      actions: ["view", "create", "edit", "delete"],
      fields: {
        id: "visible",
        name: "visible",
        email: "visible",
        role: "visible",
        station: "visible",
        partner: "visible",
        country: "visible",
        status: "visible",
        created: "visible",
        avatar: "visible",
      },
    },
    campaigns: {
      actions: ["view", "create", "edit", "delete"],
      fields: {
        id: "visible",
        title: "visible",
        station: "visible",
        country: "visible",
        contentType: "visible",
        content: "visible",
        duration: "visible",
        views: "visible",
        status: "visible",
        created: "visible",
      },
    },
    messages: {
      actions: ["view"],
      fields: {
        id: "visible",
        created: "visible",
        msisdn: "visible",
        station: "visible",
        show: "visible",
        preview: "visible",
        fullMessage: "visible",
        operator: "visible",
        country: "visible",
        status: "visible",
      },
    },
    transactions: {
      actions: ["view"],
      fields: {
        id: "visible",
        msisdn: "visible",
        amount: "visible",
        currency: "visible",
        country: "visible",
        operator: "visible",
        receipt: "visible",
        status: "visible",
        created: "visible",
        updated: "visible",
      },
    },
    reports: {
      actions: ["view"],
      fields: {
        revenue: "visible",
        messages: "visible",
        calls: "visible",
        listeners: "visible",
        campaigns: "visible",
      },
    },
    polls: {
      actions: ["view", "create", "edit", "delete"],
      fields: {
        id: "visible",
        question: "visible",
        station: "visible",
        presenter: "visible",
        options: "visible",
        totalVotes: "visible",
        status: "visible",
        created: "visible",
      },
    },
  },

  partner_admin: {
    stations: {
      actions: ["view", "create", "edit"],
      fields: {
        id: "visible",
        name: "visible",
        country: "visible",
        partner: "hidden",
        stationAdmin: "visible",
        category: "visible",
        mediaStations: "visible",
        activeShows: "visible",
        status: "visible",
        created: "visible",
        description: "visible",
      },
    },
    users: {
      actions: ["view", "create", "edit"],
      fields: {
        id: "visible",
        name: "visible",
        email: "visible",
        role: "visible",
        station: "visible",
        partner: "hidden",
        country: "visible",
        status: "visible",
        created: "visible",
        avatar: "visible",
      },
    },
    campaigns: {
      actions: ["view", "create", "edit"],
      fields: {
        id: "visible",
        title: "visible",
        station: "visible",
        country: "visible",
        contentType: "visible",
        content: "visible",
        duration: "visible",
        views: "visible",
        status: "visible",
        created: "visible",
      },
    },
    messages: {
      actions: ["view"],
      fields: {
        id: "visible",
        created: "visible",
        msisdn: "visible",
        station: "visible",
        show: "visible",
        preview: "visible",
        fullMessage: "visible",
        operator: "visible",
        country: "visible",
        status: "visible",
      },
    },
    transactions: {
      actions: ["view"],
      fields: {
        id: "visible",
        msisdn: "visible",
        amount: "visible",
        currency: "visible",
        country: "visible",
        operator: "visible",
        receipt: "visible",
        status: "visible",
        created: "visible",
        updated: "visible",
      },
    },
    reports: {
      actions: ["view"],
      fields: {
        revenue: "visible",
        messages: "visible",
        calls: "visible",
        listeners: "visible",
        campaigns: "visible",
      },
    },
    polls: {
      actions: ["view", "create", "edit"],
      fields: {
        id: "visible",
        question: "visible",
        station: "visible",
        presenter: "visible",
        options: "visible",
        totalVotes: "visible",
        status: "visible",
        created: "visible",
      },
    },
  },

  customer_care: {
    stations: {
      actions: ["view"],
      fields: {
        id: "visible",
        name: "visible",
        country: "visible",
        partner: "hidden",
        stationAdmin: "readonly",
        category: "visible",
        mediaStations: "readonly",
        activeShows: "readonly",
        status: "visible",
        created: "visible",
        description: "hidden",
      },
    },
    users: {
      actions: ["view"],
      fields: {
        id: "visible",
        name: "visible",
        email: "readonly",
        role: "visible",
        station: "visible",
        partner: "hidden",
        country: "visible",
        status: "visible",
        created: "visible",
        avatar: "visible",
      },
    },
    campaigns: {
      actions: ["view"],
      fields: {
        id: "visible",
        title: "visible",
        station: "visible",
        country: "visible",
        contentType: "visible",
        content: "readonly",
        duration: "readonly",
        views: "readonly",
        status: "visible",
        created: "visible",
      },
    },
    messages: {
      actions: ["view"],
      fields: {
        id: "visible",
        created: "visible",
        msisdn: "readonly",
        station: "visible",
        show: "visible",
        preview: "visible",
        fullMessage: "visible",
        operator: "readonly",
        country: "visible",
        status: "visible",
      },
    },
    transactions: {
      actions: ["view"],
      fields: {
        id: "visible",
        msisdn: "readonly",
        amount: "readonly",
        currency: "readonly",
        country: "visible",
        operator: "readonly",
        receipt: "readonly",
        status: "visible",
        created: "visible",
        updated: "visible",
      },
    },
    reports: {
      actions: [],
      fields: {},
    },
    polls: {
      actions: [],
      fields: {},
    },
  },

  station_admin: {
    stations: {
      actions: ["view", "edit"],
      fields: {
        id: "visible",
        name: "visible",
        country: "visible",
        partner: "hidden",
        stationAdmin: "hidden",
        category: "visible",
        mediaStations: "visible",
        activeShows: "visible",
        status: "visible",
        created: "visible",
        description: "visible",
      },
    },
    users: {
      actions: ["view", "create", "edit"],
      fields: {
        id: "visible",
        name: "visible",
        email: "visible",
        role: "visible",
        station: "hidden",
        partner: "hidden",
        country: "visible",
        status: "visible",
        created: "visible",
        avatar: "visible",
      },
    },
    campaigns: {
      actions: ["view", "create", "edit"],
      fields: {
        id: "visible",
        title: "visible",
        station: "hidden",
        country: "visible",
        contentType: "visible",
        content: "visible",
        duration: "visible",
        views: "visible",
        status: "visible",
        created: "visible",
      },
    },
    messages: {
      actions: ["view"],
      fields: {
        id: "visible",
        created: "visible",
        msisdn: "visible",
        station: "hidden",
        show: "visible",
        preview: "visible",
        fullMessage: "visible",
        operator: "visible",
        country: "visible",
        status: "visible",
      },
    },
    transactions: {
      actions: ["view"],
      fields: {
        id: "visible",
        msisdn: "visible",
        amount: "visible",
        currency: "visible",
        country: "visible",
        operator: "visible",
        receipt: "visible",
        status: "visible",
        created: "visible",
        updated: "visible",
      },
    },
    reports: {
      actions: ["view"],
      fields: {
        revenue: "visible",
        messages: "visible",
        calls: "visible",
        listeners: "visible",
        campaigns: "visible",
      },
    },
    polls: {
      actions: ["view", "create", "edit"],
      fields: {
        id: "visible",
        question: "visible",
        station: "hidden",
        presenter: "visible",
        options: "visible",
        totalVotes: "visible",
        status: "visible",
        created: "visible",
      },
    },
  },

  media_station: {
    stations: {
      actions: ["view"],
      fields: {
        id: "visible",
        name: "visible",
        country: "visible",
        partner: "hidden",
        stationAdmin: "hidden",
        category: "visible",
        mediaStations: "hidden",
        activeShows: "visible",
        status: "visible",
        created: "visible",
        description: "readonly",
      },
    },
    users: {
      actions: ["view"],
      fields: {
        id: "visible",
        name: "visible",
        email: "readonly",
        role: "visible",
        station: "hidden",
        partner: "hidden",
        country: "visible",
        status: "visible",
        created: "visible",
        avatar: "visible",
      },
    },
    campaigns: {
      actions: ["view", "create"],
      fields: {
        id: "visible",
        title: "visible",
        station: "hidden",
        country: "visible",
        contentType: "visible",
        content: "visible",
        duration: "visible",
        views: "visible",
        status: "visible",
        created: "visible",
      },
    },
    messages: {
      actions: ["view"],
      fields: {
        id: "visible",
        created: "visible",
        msisdn: "readonly",
        station: "hidden",
        show: "visible",
        preview: "visible",
        fullMessage: "visible",
        operator: "readonly",
        country: "visible",
        status: "visible",
      },
    },
    transactions: {
      actions: [],
      fields: {},
    },
    reports: {
      actions: [],
      fields: {},
    },
    polls: {
      actions: ["view"],
      fields: {
        id: "visible",
        question: "visible",
        station: "hidden",
        presenter: "visible",
        options: "visible",
        totalVotes: "visible",
        status: "visible",
        created: "visible",
      },
    },
  },

  presenter: {
    stations: {
      actions: ["view"],
      fields: {
        id: "visible",
        name: "visible",
        country: "visible",
        partner: "hidden",
        stationAdmin: "hidden",
        category: "visible",
        mediaStations: "hidden",
        activeShows: "visible",
        status: "visible",
        created: "visible",
        description: "readonly",
      },
    },
    users: {
      actions: ["view"],
      fields: {
        id: "visible",
        name: "visible",
        email: "readonly",
        role: "visible",
        station: "hidden",
        partner: "hidden",
        country: "visible",
        status: "visible",
        created: "visible",
        avatar: "visible",
      },
    },
    campaigns: {
      actions: ["view"],
      fields: {
        id: "visible",
        title: "visible",
        station: "hidden",
        country: "visible",
        contentType: "visible",
        content: "readonly",
        duration: "readonly",
        views: "readonly",
        status: "visible",
        created: "visible",
      },
    },
    messages: {
      actions: ["view"],
      fields: {
        id: "visible",
        created: "visible",
        msisdn: "readonly",
        station: "hidden",
        show: "visible",
        preview: "visible",
        fullMessage: "readonly",
        operator: "hidden",
        country: "visible",
        status: "visible",
      },
    },
    transactions: {
      actions: [],
      fields: {},
    },
    reports: {
      actions: [],
      fields: {},
    },
    polls: {
      actions: [],
      fields: {},
    },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function hasAction(role: Role, resource: string, action: Action): boolean {
  const perms = PERMISSIONS[role]?.[resource];
  if (!perms) return false;
  return perms.actions.includes(action);
}

export function getFieldVisibility(
  role: Role,
  resource: string,
  field: string
): FieldVisibility {
  const perms = PERMISSIONS[role]?.[resource];
  if (!perms) return "hidden";
  return perms.fields[field] ?? "hidden";
}

export function getVisibleFields(role: Role, resource: string): string[] {
  const perms = PERMISSIONS[role]?.[resource];
  if (!perms) return [];
  return Object.entries(perms.fields)
    .filter(([, v]) => v === "visible")
    .map(([k]) => k);
}

export function getEditableFields(role: Role, resource: string): string[] {
  const perms = PERMISSIONS[role]?.[resource];
  if (!perms) return [];
  return Object.entries(perms.fields)
    .filter(([, v]) => v === "visible" || v === "readonly")
    .map(([k]) => k);
}
