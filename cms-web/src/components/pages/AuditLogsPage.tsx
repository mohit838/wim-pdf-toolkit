"use client";

import {
  App as AntdApp,
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import {
  CmsCard,
  CmsPageHeader,
  CmsTable,
} from "../CmsUi";
import {
  getCmsErrorMessage,
  useAdmins,
  useAuditLogs,
  usePermissionsCatalog,
  useCmsSession,
} from "@/lib/cms-api";
import type { AuditLogEntry } from "@/lib/cms-types";
import { useTimezone } from "@/lib/timezone";
import { LoadingPanel, ErrorPanel } from "./shared";
import dayjs from "dayjs";

const { Text } = Typography;

export function AuditLogsPage() {
  const { message } = AntdApp.useApp();
  const { formatDate } = useTimezone();
  const session = useCmsSession();
  const isSuperadmin = session.data?.role === "SUPERADMIN";

  // Filter State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState({
    q: "",
    module: undefined as string | undefined,
    actorId: undefined as string | undefined,
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });

  const [form] = Form.useForm();

  // Data Fetching
  const catalog = usePermissionsCatalog(isSuperadmin);
  const admins = useAdmins({ page: 1, pageSize: 100 }, isSuperadmin);
  const logs = useAuditLogs({
    q: filters.q || undefined,
    module: filters.module,
    actorId: filters.actorId,
    dateFrom: filters.dateRange?.[0]?.toISOString(),
    dateTo: filters.dateRange?.[1]?.toISOString(),
    page,
    pageSize,
  });

  let actorOptions: { label: string; value: string }[] = [];

  const moduleOptions = (catalog.data?.modules || []).map((m) => ({ label: m.replace(/_/g, " ").toUpperCase(), value: m }));
  actorOptions = (admins.data?.items || []).map((a) => ({ label: `${a.name} (${a.email})`, value: a.id }));

  const onFilterChange = (values: any) => {
    setFilters(values);
    setPage(1);
  };

  const content = (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <CmsPageHeader
        eyebrow="System"
        title="Activity History"
        description="Comprehensive audit logs of all administrative actions. Use filters to narrow down specific operations."
      />

      <CmsCard title="Filters">
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(_, allValues) => onFilterChange(allValues)}
          initialValues={filters}
        >
          <Row gutter={16}>
            <Col lg={6} md={12} span={24}>
              <Form.Item label="Search (Action, Target, IP)" name="q">
                <Input.Search allowClear placeholder="Type to search..." />
              </Form.Item>
            </Col>
            <Col lg={6} md={12} span={24}>
              <Form.Item label="Module" name="module">
                <Select allowClear placeholder="All Modules" options={moduleOptions} />
              </Form.Item>
            </Col>
            <Col lg={6} md={12} span={24}>
              <Form.Item label="Performed By" name="actorId">
                <Select allowClear placeholder="All Admins" options={actorOptions} showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col lg={6} md={12} span={24}>
              <Form.Item label="Date Range" name="dateRange">
                <DatePicker.RangePicker style={{ width: "100%" }} showTime />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </CmsCard>

      <CmsCard title="Logs">
        <CmsTable
          loading={logs.isPending}
          dataSource={logs.data?.items || []}
          rowKey="id"
          expandable={{
            expandedRowRender: (record: AuditLogEntry) => (
              <div style={{ padding: "0 20px" }}>
                <Text strong>Event Details:</Text>
                <pre style={{ background: "#f5f5f5", padding: 10, borderRadius: 4, marginTop: 10, fontSize: 12 }}>
                  {JSON.stringify(record.details, null, 2)}
                </pre>
                <Space orientation="vertical" size={2} style={{ marginTop: 10 }}>
                  <Text type="secondary">IP Address: {record.ipAddress || "N/A"}</Text>
                  <Text type="secondary">Request ID: {record.requestId || "N/A"}</Text>
                  <Text type="secondary">User Agent: {record.userAgent || "N/A"}</Text>
                </Space>
              </div>
            ),
          }}
          columns={[
            {
              title: "Timestamp",
              dataIndex: "createdAt",
              key: "createdAt",
              width: 320,
              render: (val) => <Text code>{formatDate(val)}</Text>,
            },
            {
              title: "Actor",
              dataIndex: "actorEmail",
              key: "actorEmail",
              render: (val) => val || <Text type="secondary">System</Text>,
            },
            {
              title: "Module",
              dataIndex: "module",
              key: "module",
              render: (val: string) => <Tag color="blue">{val.replace(/_/g, " ").toUpperCase()}</Tag>,
            },
            {
              title: "Action",
              dataIndex: "action",
              key: "action",
              render: (val: string) => <Text strong>{val.replace(/_/g, " ").toUpperCase()}</Text>,
            },
            {
              title: "Target",
              dataIndex: "target",
              key: "target",
              render: (val) => <Text type="secondary">{val}</Text>,
            },
            {
              title: "Result",
              dataIndex: "result",
              key: "result",
              width: 100,
              render: (val: string) => (
                <Tag color={val === "success" ? "green" : "red"}>
                  {val.toUpperCase()}
                </Tag>
              ),
            },
          ]}
          pagination={{
            current: page,
            pageSize,
            total: logs.data?.total || 0,
            showSizeChanger: true,
            onChange: (p, s) => {
              setPage(p);
              setPageSize(s);
            },
          }}
        />
      </CmsCard>
    </Space>
  );

  if (session.isPending) {
    return (
      <>
        <div style={{ display: "none" }}>{content}</div>
        <LoadingPanel />
      </>
    );
  }

  if (!isSuperadmin) {
    return (
      <>
        <div style={{ display: "none" }}>{content}</div>
        <ErrorPanel message="Superadmin access required for Activity History." />
      </>
    );
  }

  return content;
}
