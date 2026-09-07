import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/types";
import { TAGS } from "./tags";

async function loadSettings(): Promise<SiteSettings> {
  const rows = await prisma.siteSetting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...map } as SiteSettings;
}

export const getSettings = unstable_cache(loadSettings, ["settings"], {
  tags: [TAGS.settings],
  revalidate: 3600,
});

export const getSettingsUncached = loadSettings;

export async function saveSettings(input: SiteSettings) {
  const entries = Object.entries(input) as [keyof SiteSettings, string][];
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } })
    )
  );
}
