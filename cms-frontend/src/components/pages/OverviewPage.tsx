"use client";

import { Col, Row, Space, Typography } from "antd";
import {
  CmsCard,
  CmsPageHeader,
  CmsStatCard,
  CmsStatusBadge,
  CmsTable,
} from "../CmsUi";
import {
  useCmsSystemStatus,
  useModuleSummary,
  useReleaseLog,
} from "@/lib/cms-api";
import { formatDate, formatLabel } from "@/lib/cms-utils";
import { LoadingPanel, ErrorPanel } from "./shared";

const { Paragraph, Text } = Typography;

export function OverviewPage() {
  const summary = useModuleSummary();
  const system = useCmsSystemStatus();
  const releases = useReleaseLog();

  if (summary.isPending || system.isPending || releases.isPending) {
    return <LoadingPanel />;
  }

  if (summary.isError || system.isError || releases.isError) {
    return <ErrorPanel message="Could not load the dashboard overview." />;
  }

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <CmsPageHeader
        eyebrow="Overview"
        title="CMS Dashboard"
        description="Monitor draft status, publish health, ad readiness, and public runtime delivery."
      />

      <Row gutter={[16, 16]}>
        <Col lg={8} span={24}>
          <CmsStatCard label="Database" note="CMS persistence" value={<CmsStatusBadge status="success">{system.data.database}</CmsStatusBadge>} />
        </Col>
        <Col lg={8} span={24}>
          <CmsStatCard label="Redis" note="Cache, sessions, and queues" value={<CmsStatusBadge status={system.data.redis === "ok" ? "success" : "error"}>{system.data.redis}</CmsStatusBadge>} />
        </Col>
        <Col lg={8} span={24}>
          <CmsStatCard
            label="Latest release"
            note={system.data.lastRelease ? `Published ${formatDate(system.data.lastRelease.publishedAt)}` : "No published release yet"}
            value={system.data.lastRelease ? `v${system.data.lastRelease.version}` : "Draft only"}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xl={15} span={24}>
          <CmsCard title="Module Status">
            <CmsTable
              columns={[
                { title: "Module", dataIndex: "title", key: "title" },
                { title: "Description", dataIndex: "description", key: "description" },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  render: (value: string) => <CmsStatusBadge status={value as "live"}>{formatLabel(value)}</CmsStatusBadge>,
                },
                { title: "Items", dataIndex: "entityCount", key: "entityCount", render: (value: number | undefined) => value ?? "—" },
              ]}
              dataSource={summary.data}
              pagination={false}
            />
          </CmsCard>
        </Col>
        <Col xl={9} span={24}>
          <CmsCard title="Release History">
            <Space orientation="vertical" size={12} style={{ width: "100%" }}>
              {releases.data.slice(0, 3).map((release) => (
                <div className="cms-list-item" key={release.id}>
                  <div>
                    <Text strong>{`Release v${release.version}`}</Text>
                    <Paragraph className="cms-inline-note">{formatDate(release.publishedAt)}</Paragraph>
                  </div>
                  <CmsStatusBadge status={release.frontendRevalidateOk ? "success" : "neutral"}>
                    {release.frontendRevalidateOk ? "Frontend updated" : "Published"}
                  </CmsStatusBadge>
                </div>
              ))}
            </Space>
          </CmsCard>
        </Col>
      </Row>
    </Space>
  );
}
