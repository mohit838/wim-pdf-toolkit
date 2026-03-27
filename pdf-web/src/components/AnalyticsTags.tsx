/* eslint-disable @next/next/no-img-element */
import Script from "next/script";
import { getRuntimeIntegrations, getRuntimeSiteConfig } from "@/lib/cms-runtime";

function resolveAdsensePublisherId(
  integrations: Awaited<ReturnType<typeof getRuntimeIntegrations>>,
  runtimeConfig: Awaited<ReturnType<typeof getRuntimeSiteConfig>>,
): string {
  const globalIntegration = integrations.find((integration) => integration.kind === "adsense");
  const integrationPublisherId = String(globalIntegration?.config.publisherId || "").trim();
  if (integrationPublisherId.startsWith("ca-pub-")) {
    return integrationPublisherId;
  }

  const placementPublisherId = runtimeConfig.adPlacements
    .filter((placement) => placement.enabled && placement.provider.startsWith("adsense"))
    .map((placement) => String(placement.config.publisherId || "").trim())
    .find((value) => value.startsWith("ca-pub-"));

  return placementPublisherId || "";
}

export default async function AnalyticsTags() {
  const [integrations, runtimeConfig] = await Promise.all([
    getRuntimeIntegrations("all_public_routes"),
    getRuntimeSiteConfig(),
  ]);
  const ga4 = integrations.find((integration) => integration.kind === "google_analytics_ga4");
  const gtm = integrations.find((integration) => integration.kind === "google_tag_manager");
  const gam = integrations.find((integration) => integration.kind === "google_ad_manager");
  const thirdPartyScript = integrations.find((integration) => integration.kind === "custom_third_party_script");
  const clarity = integrations.find((integration) => integration.kind === "microsoft_clarity");
  const metaPixel = integrations.find((integration) => integration.kind === "meta_pixel");
  const adsensePublisherId = resolveAdsensePublisherId(integrations, runtimeConfig);

  const gtmContainerId = String(gtm?.config.containerId || "").trim();
  const gtmDataLayerName = String(gtm?.config.dataLayerName || "dataLayer").trim() || "dataLayer";

  const gamNetworkCode = String(gam?.config.networkCode || "").trim();
  const gamEnableSingleRequest = Boolean(gam?.config.enableSingleRequest ?? true);
  const gamCollapseEmptyDivs = Boolean(gam?.config.collapseEmptyDivs ?? true);

  const thirdPartyScriptId = String(thirdPartyScript?.config.scriptId || "third-party-script").trim() || "third-party-script";
  const thirdPartyScriptSrc = String(thirdPartyScript?.config.scriptSrc || "").trim();
  const thirdPartyInlineScript = String(thirdPartyScript?.config.inlineScript || "");
  const thirdPartyAsync = Boolean(thirdPartyScript?.config.async ?? true);
  const thirdPartyDefer = Boolean(thirdPartyScript?.config.defer ?? false);

  return (
    <>
      {gtmContainerId ? (
        <>
          <Script id="gtm-loader" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','${gtmDataLayerName}','${gtmContainerId}');
            `}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      ) : null}

      {ga4?.config.measurementId ? (
        <>
          <Script
            id="ga4-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${String(ga4.config.measurementId)}`}
          />
          <Script id="ga4-config" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${String(ga4.config.measurementId)}');
            `}
          </Script>
        </>
      ) : null}

      {gamNetworkCode ? (
        <>
          <Script
            id="gam-loader"
            strategy="afterInteractive"
            src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"
          />
          <Script id="gam-config" strategy="afterInteractive">
            {`
              window.googletag = window.googletag || {cmd: []};
              googletag.cmd.push(function() {
                ${gamEnableSingleRequest ? "googletag.pubads().enableSingleRequest();" : ""}
                ${gamCollapseEmptyDivs ? "googletag.pubads().collapseEmptyDivs();" : ""}
                googletag.enableServices();
              });
            `}
          </Script>
        </>
      ) : null}

      {thirdPartyScriptSrc ? (
        <Script
          id={`${thirdPartyScriptId}-src`}
          strategy="afterInteractive"
          src={thirdPartyScriptSrc}
          async={thirdPartyAsync}
          defer={thirdPartyDefer}
        />
      ) : null}

      {thirdPartyInlineScript.trim() ? (
        <Script id={`${thirdPartyScriptId}-inline`} strategy="afterInteractive">
          {thirdPartyInlineScript}
        </Script>
      ) : null}

      {clarity?.config.projectId ? (
        <Script id="clarity-config" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${String(clarity.config.projectId)}");
          `}
        </Script>
      ) : null}

      {metaPixel?.config.pixelId ? (
        <>
          <Script id="meta-pixel-loader" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${String(metaPixel.config.pixelId)}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${String(metaPixel.config.pixelId)}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      ) : null}

      {adsensePublisherId ? (
        <Script
          id="adsense-loader"
          strategy="afterInteractive"
          async
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisherId}`}
        />
      ) : null}
    </>
  );
}
