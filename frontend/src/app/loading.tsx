import SiteStatusScreen from "@/components/SiteStatusScreen";
import MainLayout from "@/layouts/MainLayout";
import { systemConfig } from "./site";

export default function Loading() {
  const copy = systemConfig.loading;

  return (
    <MainLayout>
      <SiteStatusScreen
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      >
        <div className="status-loader" role="status" aria-live="polite" aria-label={copy.statusLabel}>
          <div className="status-loader-art" aria-hidden="true">
            <span className="status-loader-ring status-loader-ring-outer" />
            <span className="status-loader-ring status-loader-ring-inner" />
            <span className="status-loader-core" />
          </div>
          <p className="status-loader-label">{copy.statusLabel}</p>
        </div>
      </SiteStatusScreen>
    </MainLayout>
  );
}
