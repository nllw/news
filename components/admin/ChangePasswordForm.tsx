"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { changeOwnPasswordAction } from "@/app/admin/actions/users";
import { changePasswordSchema } from "@/lib/validation/user";

type Values = z.infer<typeof changePasswordSchema>;

export function ChangePasswordForm() {
  const [pending, start] = useTransition();
  const { register, handleSubmit, formState, reset, setError } = useForm<Values>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const err = (k: keyof Values) => formState.errors[k]?.message;

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) =>
        start(async () => {
          const res = await changeOwnPasswordAction(values);
          if (res.ok) {
            toast.success("Password changed");
            reset();
          } else {
            for (const [k, v] of Object.entries(res.fieldErrors ?? {}))
              if (v?.[0]) setError(k as keyof Values, { message: v[0] });
            toast.error(res.error ?? "Could not change password");
          }
        })
      )}
    >
      <Field id="currentPassword" label="Current password" error={err("currentPassword")}>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          {...register("currentPassword")}
          invalid={Boolean(err("currentPassword"))}
        />
      </Field>
      <Field id="newPassword" label="New password" error={err("newPassword")}>
        <Input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          {...register("newPassword")}
          invalid={Boolean(err("newPassword"))}
        />
      </Field>
      <Field id="confirmPassword" label="Confirm new password" error={err("confirmPassword")}>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          invalid={Boolean(err("confirmPassword"))}
        />
      </Field>
      <Button type="submit" loading={pending}>
        Update password
      </Button>
    </form>
  );
}
