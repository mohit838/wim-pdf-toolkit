"use client";

import { Col, Row, Space } from "antd";
import {
  CmsCard,
  CmsPageHeader,
  CmsStatCard,
  CmsTable,
} from "../../CmsUi";
import { AD_SLOT_PRESETS } from "@/lib/cms-constants";
import { useAdsDraft } from "@/lib/cms-api";
import { formatLabel } from "@/lib/cms-utils";
import { LoadingPanel, ErrorPanel } from "../shared";

export function AdsOverviewPage() {
  const draft = useAdsDraft();

  if (draft.isPending) {
    return <LoadingPanel />;
  }

  if (draft.isError) {
    return <ErrorPanel message="Could not load the ads overview." />;
  }

  const placements = draft.data.adPlacements;
  const enabled = placements.filter((item) => item.enabled).length;

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <CmsPageHeader
        eyebrow="Ads"
        title="Ads Overview"
        description="Control custom placements, optional AdSense settings, ads.txt content, and runtime slot coverage."
      />
      <Row gutter={[16, 16]}>
        <Col md={8} span={24}>
          <CmsStatCard label="Placements" note="Draft slot records" value={placements.length} />
        </Col>
        <Col md={8} span={24}>
          <CmsStatCard label="Enabled" note="Live-ready placements" value={enabled} />
        </Col>
        <Col md={8} span={24}>
          <CmsStatCard label="Ads.txt lines" note="Publisher declarations" value={draft.data.adsTxtLines.length} />
        </Col>
      </Row>
      <CmsCard title="Theme slot coverage">
        <CmsTable
          columns={[
            { title: "Slot", dataIndex: "label", key: "label" },
            { title: "Scope", dataIndex: "scope", key: "scope", render: (value) => formatLabel(value) },
            { title: "Description", dataIndex: "description", key: "description" },
          ]}
          dataSource={AD_SLOT_PRESETS}
        />
      </CmsCard>
    </Space>
  );
}
