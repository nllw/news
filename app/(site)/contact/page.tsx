import type { Metadata } from "next";
import { getSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/env";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact",
  alternates: { canonical: `${siteUrl}/contact` },
};

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <div className="container py-10">
      <article className="prose prose-news mx-auto max-w-2xl dark:prose-invert">
        <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">
          Contact
        </p>
        <h1 className="font-display text-4xl font-bold">Get in touch</h1>
        <p className="lead">We welcome tips, corrections, and feedback from readers.</p>
        {settings.contactEmail ? (
          <>
            <h2>Email</h2>
            <p>
              <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>
            </p>
          </>
        ) : (
          <p>The newsroom has not published a contact address yet. Please check back soon.</p>
        )}
        {settings.twitter || settings.facebook || settings.instagram ? (
          <>
            <h2>Social</h2>
            <ul>
              {settings.twitter ? (
                <li>
                  <a href={settings.twitter} rel="noopener noreferrer" target="_blank">
                    X
                  </a>
                </li>
              ) : null}
              {settings.facebook ? (
                <li>
                  <a href={settings.facebook} rel="noopener noreferrer" target="_blank">
                    Facebook
                  </a>
                </li>
              ) : null}
              {settings.instagram ? (
                <li>
                  <a href={settings.instagram} rel="noopener noreferrer" target="_blank">
                    Instagram
                  </a>
                </li>
              ) : null}
            </ul>
          </>
        ) : null}
        <h2>Corrections</h2>
        <p>
          To request a correction, include the headline, the URL, and a description of what you
          believe is inaccurate.
        </p>
      </article>
    </div>
  );
}
