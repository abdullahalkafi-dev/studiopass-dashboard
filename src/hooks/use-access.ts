"use client";

import { useAppSelector } from "@/store/hooks";
import {
  hasAction,
  getFieldVisibility,
  getVisibleFields,
  getEditableFields,
  type Role,
  type Action,
  type FieldVisibility,
} from "@/lib/access/permissions";

export function useAccess(resource: string) {
  const role = useAppSelector(
    (state) => (state.auth.user?.role ?? "super_admin") as Role
  );

  return {
    role,
    canView: hasAction(role, resource, "view"),
    canCreate: hasAction(role, resource, "create"),
    canEdit: hasAction(role, resource, "edit"),
    canDelete: hasAction(role, resource, "delete"),
    canPerform: (action: Action) => hasAction(role, resource, action),
    isVisible: (field: string) =>
      getFieldVisibility(role, resource, field) === "visible",
    isReadonly: (field: string) =>
      getFieldVisibility(role, resource, field) === "readonly",
    isHidden: (field: string) =>
      getFieldVisibility(role, resource, field) === "hidden",
    getFieldVisibility: (field: string): FieldVisibility =>
      getFieldVisibility(role, resource, field),
    visibleFields: getVisibleFields(role, resource),
    editableFields: getEditableFields(role, resource),
  };
}

export function checkAccess(
  role: Role,
  resource: string,
  action: Action
): boolean {
  return hasAction(role, resource, action);
}
