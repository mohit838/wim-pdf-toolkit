"use client";

import { Button, Space } from "antd";
import Link from "next/link";
import {
  CmsCard,
  CmsPageHeader,
  CmsTable,
} from "../CmsUi";
import { REQUIRED_LEGAL_SLUGS } from "@/lib/cms-constants";
import { useLegalPagesDraft } from "@/lib/cms-api";
import type { LegalPageDocument } from "@/lib/cms-types";
import { createEmptyLegalPage } from "@/lib/cms-utils";
import { LoadingPanel, ErrorPanel } from "./shared";

export function LegalPagesPage() {
  const draft = useLegalPagesDraft();

  if (draft.isPending) {
    return <LoadingPanel />;
  }

  if (draft.isError) {
    return <ErrorPanel message="Could not load the legal pages draft." />;
  }

  const requiredRows = REQUIRED_LEGAL_SLUGS.map((slug) => draft.data[slug] || createEmptyLegalPage(slug));
  const customRows = Object.values(draft.data).filter((page) => !REQUIRED_LEGAL_SLUGS.includes(page.slug as typeof REQUIRED_LEGAL_SLUGS[number]));
  const rows = [...requiredRows, ...customRows];

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <CmsPageHeader
        eyebrow="Content"
        title="Legal Pages"
        description="Edit fixed policy pages and create extra custom pages. Fixed pages keep their root routes, custom pages publish under /pages/:slug."
        extra={<Link href="/legal-pages/new"><Button>Create custom page</Button></Link>}
      />
      <CmsCard>
        <CmsTable
          columns={[
            { title: "Slug", dataIndex: "slug", key: "slug" },
            { title: "Title", dataIndex: "title", key: "title" },
            {
              title: "Route",
              key: "route",
              render: (_, row: LegalPageDocument) => REQUIRED_LEGAL_SLUGS.includes(row.slug as typeof REQUIRED_LEGAL_SLUGS[number])
                ? `/${row.slug}`
                : `/pages/${row.slug}`,
            },
            { title: "Description", dataIndex: "description", key: "description" },
            {
              title: "Actions",
              key: "actions",
              render: (_, row: LegalPageDocument) => <Link href={`/legal-pages/${row.slug}`}>Edit</Link>,
            },
          ]}
          dataSource={rows}
          rowKey="slug"
          pagination={false}
        />
      </CmsCard>
    </Space>
  );
}
