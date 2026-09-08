"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { saveSettingsAction } from "@/app/admin/actions/settings";
import { settingsSchema, type SettingsInput } from "@/lib/validation/user";
import type { SiteSettings } from "@/lib/types";

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [pending, start] = useTransition();
  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
  });
  const { register, handleSubmit, formState, setError } = form;
  const err = (k: keyof SettingsInput) => formState.errors[k]?.message;

  return (
    <form
      className="max-w-2xl space-y-6"
      onSubmit={handleSubmit((values) =>
        start(async () => {
          const res = await saveSettingsAction(values);
          if (res.ok) {
            toast.success("Settings saved");
            form.reset(values);
          } else {
            for (const [k, v] of Object.entries(res.fieldErrors ?? {})) {
              if (v?.[0]) setError(k as keyof SettingsInput, { message: v[0] });
            }
            toast.error(res.error ?? "Could not save");
          }
        })
      )}
    >
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>
            Appears in the masthead, browser tab, and social previews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="siteName" label="Site name" required error={err("siteName")}>
            <Input id="siteName" {...register("siteName")} invalid={Boolean(err("siteName"))} />
          </Field>
          <Field id="tagline" label="Tagline" error={err("tagline")}>
            <Input id="tagline" {...register("tagline")} />
          </Field>
          <Field
            id="description"
            label="Description"
            hint="Used for search engines and the default social preview."
            error={err("description")}
          >
            <Textarea id="description" rows={3} {...register("description")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact and social</CardTitle>
          <CardDescription>Full URLs. Leave blank to hide a link.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="contactEmail" label="Contact email" error={err("contactEmail")}>
            <Input
              id="contactEmail"
              type="email"
              {...register("contactEmail")}
              invalid={Boolean(err("contactEmail"))}
            />
          </Field>
          <Field id="twitter" label="X profile URL" error={err("twitter")}>
            <Input id="twitter" placeholder="https://x.com/yourpaper" {...register("twitter")} />
          </Field>
          <Field id="facebook" label="Facebook page URL" error={err("facebook")}>
            <Input
              id="facebook"
              placeholder="https://facebook.com/yourpaper"
              {...register("facebook")}
            />
          </Field>
          <Field id="instagram" label="Instagram URL" error={err("instagram")}>
            <Input
              id="instagram"
              placeholder="https://instagram.com/yourpaper"
              {...register("instagram")}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending} disabled={!formState.isDirty}>
          Save settings
        </Button>
        {formState.isDirty ? (
          <span className="text-xs text-muted-ui-foreground">Unsaved changes</span>
        ) : null}
      </div>
    </form>
  );
}
