"use client";

import React, { useState, forwardRef, useId } from "react";
import { Eye, EyeOff, Check, X, ShieldCheck } from "lucide-react";
import { evaluatePassword, PasswordCriteria } from "@/lib/validators/password";

export { evaluatePassword };
export type { PasswordCriteria };

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showStrength?: boolean;
  showChecklist?: boolean;
  containerClassName?: string;
  hint?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      label,
      error,
      showStrength = false,
      showChecklist = true,
      containerClassName = "",
      hint,
      className = "",
      required,
      id: customId,
      value: controlledValue,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const [showPassword, setShowPassword] = useState(false);
    const [internalValue, setInternalValue] = useState<string>(
      typeof defaultValue === "string" ? defaultValue : ""
    );

    // Current value for evaluation
    const currentVal =
      controlledValue !== undefined
        ? String(controlledValue)
        : internalValue;

    const evaluation = evaluatePassword(currentVal);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (controlledValue === undefined) {
        setInternalValue(e.target.value);
      }
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-foreground mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        {/* Input container */}
        <div className="relative">
          <input
            {...props}
            ref={ref}
            id={inputId}
            type={showPassword ? "text" : "password"}
            value={controlledValue}
            defaultValue={defaultValue}
            onChange={handleChange}
            required={required}
            className={`w-full px-3.5 py-2 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground transition-all pr-10 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-border focus:border-[#02B2FF] focus:ring-[#02B2FF]/20"
            } ${className}`}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/60 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff size={16} className="text-muted-foreground" />
            ) : (
              <Eye size={16} className="text-muted-foreground" />
            )}
          </button>
        </div>

        {hint && !error && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>
        )}

        {error && (
          <p className="text-xs text-red-500 font-medium mt-1 animate-in fade-in duration-150">
            {error}
          </p>
        )}

        {/* Real-time Strength Meter & Checklist */}
        {showStrength && currentVal.length > 0 && (
          <div className="space-y-2 pt-1 animate-in fade-in duration-200">
            {/* Strength Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground font-medium flex items-center gap-1">
                  <ShieldCheck size={13} className="text-[#02B2FF]" /> Strength:
                </span>
                <span className={`font-semibold ${evaluation.colorClass}`}>
                  {evaluation.label}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 h-1.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`rounded-full transition-all duration-300 ${
                      evaluation.score >= level
                        ? evaluation.barColor
                        : "bg-muted dark:bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Criteria Checklist with Green/Red Live Validation */}
            {showChecklist && (
              <div className="rounded-lg bg-muted/40 border border-border/50 p-2.5 space-y-1.5 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground text-[10px] uppercase tracking-wider">
                  Password Requirements
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    {evaluation.criteria.minLength ? (
                      <Check size={13} className="text-emerald-500 shrink-0 stroke-[2.5]" />
                    ) : (
                      <X size={13} className="text-red-400/80 shrink-0 stroke-[2]" />
                    )}
                    <span
                      className={
                        evaluation.criteria.minLength
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      At least 8 characters
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {evaluation.criteria.hasUpper ? (
                      <Check size={13} className="text-emerald-500 shrink-0 stroke-[2.5]" />
                    ) : (
                      <X size={13} className="text-red-400/80 shrink-0 stroke-[2]" />
                    )}
                    <span
                      className={
                        evaluation.criteria.hasUpper
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      One uppercase letter (A-Z)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {evaluation.criteria.hasLower ? (
                      <Check size={13} className="text-emerald-500 shrink-0 stroke-[2.5]" />
                    ) : (
                      <X size={13} className="text-red-400/80 shrink-0 stroke-[2]" />
                    )}
                    <span
                      className={
                        evaluation.criteria.hasLower
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      One lowercase letter (a-z)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {evaluation.criteria.hasNumber ? (
                      <Check size={13} className="text-emerald-500 shrink-0 stroke-[2.5]" />
                    ) : (
                      <X size={13} className="text-red-400/80 shrink-0 stroke-[2]" />
                    )}
                    <span
                      className={
                        evaluation.criteria.hasNumber
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      One number (0-9)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:col-span-2">
                    {evaluation.criteria.hasSpecial ? (
                      <Check size={13} className="text-emerald-500 shrink-0 stroke-[2.5]" />
                    ) : (
                      <X size={13} className="text-red-400/80 shrink-0 stroke-[2]" />
                    )}
                    <span
                      className={
                        evaluation.criteria.hasSpecial
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      One special character (!@#$%^&*)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

interface LegacyPasswordStrengthInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  disabled?: boolean;
  showChecklist?: boolean;
  error?: string;
  hint?: string;
  required?: boolean;
}

export function PasswordStrengthInput({
  value,
  onChange,
  placeholder = "Enter new password",
  label = "New Password",
  id = "new-password",
  disabled = false,
  showChecklist = true,
  error,
  hint,
  required,
}: LegacyPasswordStrengthInputProps) {
  return (
    <PasswordInput
      id={id}
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      showStrength={true}
      showChecklist={showChecklist}
      error={error}
      hint={hint}
      required={required}
    />
  );
}
