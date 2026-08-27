import { z } from "zod";

/**
 * Standard password validation schema matching backend security rules:
 * - Minimum 8 characters
 * - Maximum 64 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*...)
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password must not exceed 64 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter (A-Z)")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter (a-z)")
  .regex(/[0-9]/, "Password must contain at least one number (0-9)")
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/,
    "Password must contain at least one special character (!@#$%^&*)"
  );

/**
 * Optional password schema for edit forms:
 * - Allows empty string (to keep existing password)
 * - Validates fully if any text is provided
 */
export const optionalPasswordSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine(
    (val) => {
      if (!val || val === "") return true;
      return (
        val.length >= 8 &&
        val.length <= 64 &&
        /[A-Z]/.test(val) &&
        /[a-z]/.test(val) &&
        /[0-9]/.test(val) &&
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(val)
      );
    },
    {
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
    }
  );

export interface PasswordCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function evaluatePassword(password: string): {
  criteria: PasswordCriteria;
  score: number;
  label: string;
  colorClass: string;
  barColor: string;
  isValid: boolean;
} {
  const criteria: PasswordCriteria = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };

  const score = Object.values(criteria).filter(Boolean).length;
  const isValid = score === 5;

  let label = "Too Weak";
  let colorClass = "text-red-500";
  let barColor = "bg-red-500";

  if (score === 0 || password.length === 0) {
    label = "Enter a password";
    colorClass = "text-muted-foreground";
    barColor = "bg-muted";
  } else if (score <= 2) {
    label = "Weak";
    colorClass = "text-red-500";
    barColor = "bg-red-500";
  } else if (score === 3) {
    label = "Fair";
    colorClass = "text-amber-500";
    barColor = "bg-amber-500";
  } else if (score === 4) {
    label = "Good";
    colorClass = "text-blue-500";
    barColor = "bg-blue-500";
  } else if (score === 5) {
    label = "Strong";
    colorClass = "text-emerald-500";
    barColor = "bg-emerald-500";
  }

  return { criteria, score, label, colorClass, barColor, isValid };
}
