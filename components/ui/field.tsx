import * as React from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string | string[];
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  trailing?: React.ReactNode;
}

/** Label + control + hint + error, wired with aria-describedby. */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
  trailing,
}: FieldProps) {
  const err = Array.isArray(error) ? error[0] : error;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>
          {label}
          {required ? <span className="text-destructive"> *</span> : null}
        </Label>
        {trailing}
      </div>
      {children}
      {err ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {err}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-ui-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, error?: string | string[], hint?: string) {
  const err = Array.isArray(error) ? error[0] : error;
  if (err) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
