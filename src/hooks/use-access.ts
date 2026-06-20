"use client";

import { useDevSession } from "./use-dev-session";
import {
  hasAction,
  getFieldVisibility,
  getVisibleFields,
  getEditableFields,
  type Role,
  type Action,
  type FieldVisibility,
} from "@/lib/access/permissions";

/**
 * Hook for role-based field/column visibility.
 * Pure lookup against the permissions config — no business logic.
 *
 * Usage:
 *   const access = useAccess("stations");
 *   access.canView        → boolean
 *   access.canCreate      → boolean
 *   access.isVisible("name") → boolean
 *   access.visibleFields  → string[]
 */
export function useAccess(resource: string) {
  const { role } = useDevSession();

  return {
    role,
    canView: hasAction(role, resource, "view"),
    canCreate: hasAction(role, resource, "create"),
    canEdit: hasAction(role, resource, "edit"),
    canDelete: hasAction(role, resource, "delete"),
    canPerform: (action: Action) => hasAction(role, resource, action),
    isVisible: (field: string) => getFieldVisibility(role, resource, field) === "visible",
    isReadonly: (field: string) => getFieldVisibility(role, resource, field) === "readonly",
    isHidden: (field: string) => getFieldVisibility(role, resource, field) === "hidden",
    getFieldVisibility: (field: string): FieldVisibility => getFieldVisibility(role, resource, field),
    visibleFields: getVisibleFields(role, resource),
    editableFields: getEditableFields(role, resource),
  };
}

/**
 * Convenience hook: checks if a specific role has access to a resource.
 * Useful for conditional rendering outside of hooks context.
 */
export function checkAccess(role: Role, resource: string, action: Action): boolean {
  return hasAction(role, resource, action);
}
