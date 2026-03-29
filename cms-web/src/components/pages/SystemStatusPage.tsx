"use client";

import {
  App as AntdApp,
  Button,
  Form,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  CmsCard,
  CmsPageHeader,
  CmsTable,
} from "../CmsUi";
import {
  getCmsErrorMessage,
  useCmsSystemStatus,
  useRefreshRuntimeCaches,
} from "@/lib/cms-api";
import { LoadingPanel, ErrorPanel } from "./shared";
import { 
  DatabaseOutlined, 
  CloudSyncOutlined, 
  HistoryOutlined, 
  SyncOutlined,
  CheckCircleFilled,
  CloseCircleFilled
} from "@ant-design/icons";

const { Text } = Typography;

function isServiceHealthy(status: string | undefined): boolean {
  if (!status) {
    return false;
  }

  const normalized = status.toLowerCase();
  return normalized === "ok" || normalized === "connected" || normalized === "healthy";
}

export function SystemStatusPage() {
  const { message } = AntdApp.useApp();
  const systemStatus = useCmsSystemStatus();
  const refreshCache = useRefreshRuntimeCaches({
    onSuccess: () => message.success("Frontend and CMS caches refreshed successfully."),
    onError: (error: any) => message.error(getCmsErrorMessage(error, "Could not refresh caches.")),
  });

  const data = systemStatus.data;

  if (systemStatus.isPending) {
    return <LoadingPanel />;
  }

  if (systemStatus.isError) {
    return <ErrorPanel message="Could not load system status. The backend might be offline." />;
  }

  const dbOk = isServiceHealthy(data?.database);
  const redisOk = isServiceHealthy(data?.redis);

  return (
    <Space orientation="vertical" size={24} style={{ width: "100%" }}>
      <CmsPageHeader
        eyebrow="System"
        title="Infrastructure Health"
        description="Live monitoring of core backend services and caching layers."
        extra={
          <Button 
            icon={<SyncOutlined />} 
            onClick={() => systemStatus.refetch()}
            loading={systemStatus.isRefetching}
          >
            Refresh Status
          </Button>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <CmsCard title="Core Services">
          <Space orientation="vertical" size={16} style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Space>
                <DatabaseOutlined style={{ fontSize: 20 }} />
                <Text strong>PostgreSQL Database</Text>
              </Space>
              <Tag 
                icon={dbOk ? <CheckCircleFilled /> : <CloseCircleFilled />} 
                color={dbOk ? "success" : "error"}
              >
                {data?.database.toUpperCase()}
              </Tag>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Space>
                <CloudSyncOutlined style={{ fontSize: 20 }} />
                <Text strong>Redis Cache Layer</Text>
              </Space>
              <Tag 
                icon={redisOk ? <CheckCircleFilled /> : <CloseCircleFilled />} 
                color={redisOk ? "success" : "error"}
              >
                {data?.redis.toUpperCase()}
              </Tag>
            </div>
          </Space>
        </CmsCard>

        <CmsCard title="Last Deployment">
          <Space orientation="vertical" size={16} style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Space>
                <HistoryOutlined style={{ fontSize: 20 }} />
                <Text strong>Current Release</Text>
              </Space>
              <Text code>v{data?.lastRelease?.version || "N/A"}</Text>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text type="secondary">Published At</Text>
              <Text>{data?.lastRelease?.publishedAt ? new Date(data.lastRelease.publishedAt).toLocaleString() : "Never"}</Text>
            </div>
          </Space>
        </CmsCard>
      </div>

      <CmsCard title="Maintenance Operations">
        <Space orientation="vertical" style={{ width: "100%" }}>
          <Text type="secondary">
            Perform a soft-refresh of the public frontend and the CMS backend data caches. This is useful if you have manually updated the database or if values are not reflecting on the site.
          </Text>
          <div style={{ marginTop: 12 }}>
            <Button 
              type="primary" 
              danger 
              icon={<SyncOutlined />} 
              onClick={() => refreshCache.mutate({ clearCmsCache: true, revalidateFrontend: true })}
              loading={refreshCache.isPending}
            >
              Force Sync & Refresh All Caches
            </Button>
          </div>
        </Space>
      </CmsCard>
    </Space>
  );
}
