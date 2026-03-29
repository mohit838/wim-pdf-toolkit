import { getRuntimeIntegrations } from "@/lib/cms-runtime";

export default async function RuntimeHeadTags() {
  const integrations = await getRuntimeIntegrations("all_public_routes");

  return (
    <>
      {integrations.map((integration) => {
        if (integration.kind === "google_search_console") {
          const content = String(integration.config.verificationToken || "").trim();
          return content ? <meta key={integration.id} name="google-site-verification" content={content} /> : null;
        }

        if (integration.kind === "bing_webmaster") {
          const content = String(integration.config.verificationToken || "").trim();
          return content ? <meta key={integration.id} name="msvalidate.01" content={content} /> : null;
        }

        if (integration.kind === "custom_verification_meta") {
          const name = String(integration.config.metaName || "").trim();
          const content = String(integration.config.metaContent || "").trim();
          return name && content ? <meta key={integration.id} name={name} content={content} /> : null;
        }

        return null;
      })}
    </>
  );
}
