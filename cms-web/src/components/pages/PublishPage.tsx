"use client";

import { Alert, DatePicker, Input, Space, Switch, Typography } from "antd";
import { useState } from "react";
import {
  CmsActionButton,
  CmsCard,
  CmsPageHeader,
  CmsStatusBadge,
  CmsTable,
} from "../CmsUi";
import {
  getCmsErrorMessage,
  useCmsSystemStatus,
  usePublishReadiness,
  usePublishCms,
  useRefreshRuntimeCaches,
  useReleaseLog,
} from "@/lib/cms-api";
import { formatDate } from "@/lib/cms-utils";
import { LoadingPanel, ErrorPanel } from "./shared";
import { App as AntdApp } from "antd";

const { Text } = Typography;

export function PublishPage() {
  const { message } = AntdApp.useApp();
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [clearCmsCache, setClearCmsCache] = useState(true);
  const [revalidateFrontend, setRevalidateFrontend] = useState(true);

  const status = useCmsSystemStatus();
  const releases = useReleaseLog({
    q: query.trim() || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const readiness = usePublishReadiness();
  const publish = usePublishCms();
  const refreshCaches = useRefreshRuntimeCaches();

  if (status.isPending || releases.isPending || readiness.isPending) {
    return <LoadingPanel />;
  }

  if (status.isError || releases.isError || readiness.isError) {
    return <ErrorPanel message="Could not load the publish dashboard." />;
  }

  const failedChecks = readiness.data.checks.filter((check) => !check.ok);
  const publishDisabled = publish.isPending || !readiness.data.canPublish || !readiness.data.hasChanges;
  const refreshDisabled = refreshCaches.isPending || (!clearCmsCache && !revalidateFrontend);

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <CmsPageHeader
        eyebrow="Operations"
        title="Publish Live"
        description="Draft changes stay internal until you publish. Publishing updates the public site without a frontend rebuild."
        extra={
          <CmsActionButton
            disabled={publishDisabled}
            loading={publish.isPending}
            onClick={() => {
              void publish.mutateAsync().then((release) => {
                message.success(`Published release v${release.version}.`);
              }).catch((error) => {
                message.error(getCmsErrorMessage(error, "Could not publish the CMS content."));
              });
            }}
          >
            Publish live
          </CmsActionButton>
        }
      />

      <CmsCard title="Manual cache controls">
        <Space orientation="vertical" size={14} style={{ width: "100%" }}>
          <Space wrap size={18}>
            <Space size={10}>
              <Switch checked={clearCmsCache} onChange={setClearCmsCache} />
              <Text>Clear CMS API cache</Text>
            </Space>
            <Space size={10}>
              <Switch checked={revalidateFrontend} onChange={setRevalidateFrontend} />
              <Text>Revalidate frontend web cache</Text>
            </Space>
          </Space>

          <Space wrap>
            <CmsActionButton
              disabled={refreshDisabled}
              loading={refreshCaches.isPending}
              onClick={() => {
                void refreshCaches.mutateAsync({ clearCmsCache, revalidateFrontend }).then((result) => {
                  if (result.frontendRevalidateOk === false) {
                    message.warning(result.frontendRevalidateNote || "Cache refresh completed with a frontend revalidation warning.");
                    return;
                  }
                  message.success("Cache refresh completed.");
                }).catch((error) => {
                  message.error(getCmsErrorMessage(error, "Could not refresh caches."));
                });
              }}
            >
              Refresh caches now
            </CmsActionButton>
            <Text type="secondary">Use this when frontend seems stale without any new publish.</Text>
          </Space>
        </Space>
      </CmsCard>

      <CmsCard title="Release filters">
        <Space wrap size={12}>
          <Input.Search
            allowClear
            enterButton
            size="large"
            placeholder="Search by version or actor email"
            value={searchText}
            style={{ minWidth: 320 }}
            onChange={(event) => {
              const value = event.target.value;
              setSearchText(value);
              if (!value.trim()) {
                setQuery("");
              }
            }}
            onSearch={(value) => {
              setQuery(value.trim());
            }}
          />
          <DatePicker.RangePicker
            allowClear
            format="YYYY-MM-DD"
            onChange={(_, dateStrings) => {
              const [from, to] = dateStrings;
              setDateFrom(from || "");
              setDateTo(to || "");
            }}
          />
        </Space>
      </CmsCard>
      {!readiness.data.hasChanges ? (
        <Alert
          showIcon
          type="info"
          title="No unpublished changes found."
          description="Publish is disabled until you update SEO, ads, legal pages, or other draft content."
        />
      ) : null}
      {failedChecks.length > 0 ? (
        <Alert
          showIcon
          type="error"
          title="Publish is blocked by system health checks."
          description={failedChecks.map((check) => `${check.label}: ${check.message}`).join(" ")}
        />
      ) : null}
      {status.data.lastRelease?.frontendRevalidateOk === false ? (
        <Alert
          showIcon
          type="warning"
          title="The last release published, but frontend revalidation reported a problem."
          description={status.data.lastRelease.frontendRevalidateNote || "Check the frontend revalidation route and publish again if needed."}
        />
      ) : null}
      <CmsCard title="Release history">
        <CmsTable
          columns={[
            { title: "Version", dataIndex: "version", key: "version", render: (value) => `v${value}` },
            { title: "Published at", dataIndex: "publishedAt", key: "publishedAt", render: (value) => formatDate(value) },
            { title: "Actor", dataIndex: "actorEmail", key: "actorEmail", render: (value) => value || "-" },
            {
              title: "Frontend",
              key: "frontend",
              render: (_, row) => (
                <CmsStatusBadge status={row.frontendRevalidateOk ? "success" : "neutral"}>
                  {row.frontendRevalidateOk ? "Updated" : "Published"}
                </CmsStatusBadge>
              ),
            },
          ]}
          dataSource={releases.data.slice(0, 3)}
        />
      </CmsCard>
    </Space>
  );
}
