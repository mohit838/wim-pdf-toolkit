"use client";

import {
  App as AntdApp,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Col,
  Select,
  Space,
  Switch,
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
  useIntegrationsDraft,
  useSaveIntegrationsDraft,
} from "@/lib/cms-api";
import type { RuntimeIntegration, IntegrationKind, IntegrationScope, RuntimeEnvironment } from "@/lib/cms-types";
import { LoadingPanel, ErrorPanel } from "./shared";

const { Text } = Typography;

const INTEGRATION_OPTIONS: { label: string; value: IntegrationKind }[] = [
  { label: "Google Analytics (GA4)", value: "google_analytics_ga4" },
  { label: "Google Tag Manager", value: "google_tag_manager" },
  { label: "Facebook / Meta Pixel", value: "meta_pixel" },
  { label: "Microsoft Clarity", value: "microsoft_clarity" },
  { label: "AdSense Auto-Ads Script", value: "adsense" },
  { label: "Custom Header Script", value: "custom_third_party_script" },
  { label: "Domain Verification (Meta tag)", value: "custom_verification_meta" },
];

const SCOPE_OPTIONS: { label: string; value: IntegrationScope }[] = [
  { label: "Global (All Public Pages)", value: "all_public_routes" },
  { label: "Tool Pages Only", value: "tool_pages" },
  { label: "Homepage Only", value: "home_only" },
  { label: "FAQ Only", value: "faq_only" },
];

export function IntegrationsPage() {
  const { message } = AntdApp.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RuntimeIntegration | null>(null);
  const [form] = Form.useForm();

  const integrations = useIntegrationsDraft();
  const saveIntegrations = useSaveIntegrationsDraft({
    onSuccess: () => {
      message.success("Integrations updated.");
      setOpen(false);
    },
    onError: (error) => message.error(getCmsErrorMessage(error, "Could not save integrations.")),
  });

  const allItems = integrations.data || [];

  const handleEdit = (record: RuntimeIntegration) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      configId: record.config.id || "",
    });
    setOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const next = allItems.filter((item) => item.id !== id);
    await saveIntegrations.mutateAsync(next);
  };

  const onFinish = async (values: any) => {
    const payload: RuntimeIntegration = {
      id: editing?.id || `int-${Date.now()}`,
      kind: values.kind,
      enabled: values.enabled ?? true,
      scope: values.scope,
      environment: values.environment ?? "all",
      notes: values.notes || "",
      lastPublishedAt: editing?.lastPublishedAt || null,
      config: {
        id: values.configId,
      },
    };

    const next = editing
      ? allItems.map((item) => (item.id === editing.id ? payload : item))
      : [...allItems, payload];

    await saveIntegrations.mutateAsync(next);
  };

  if (integrations.isPending) {
    return (
      <div style={{ display: "none" }}>
        <Form form={form} />
        <LoadingPanel />
      </div>
    );
  }

  if (integrations.isError) {
    return (
      <div style={{ display: "none" }}>
        <Form form={form} />
        <ErrorPanel message="Could not load integrations draft." />
      </div>
    );
  }

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <CmsPageHeader
        eyebrow="Configuration"
        title="Third-Party Integrations"
        description="Connect external services like Analytics, Tag Managers, and Advertisement scripts to your public website."
        extra={
          <Button type="primary" onClick={handleAdd}>Add Integration</Button>
        }
      />

      <CmsCard>
        <CmsTable
          dataSource={allItems}
          rowKey="id"
          columns={[
            {
              title: "Provider",
              dataIndex: "kind",
              key: "kind",
              render: (kind) => <Tag color="blue">{kind.toUpperCase()}</Tag>,
            },
            {
              title: "Status",
              dataIndex: "enabled",
              key: "enabled",
              render: (enabled) => (
                <Tag color={enabled ? "green" : "red"}>{enabled ? "ACTIVE" : "DISABLED"}</Tag>
              ),
            },
            {
              title: "ID / Key",
              dataIndex: ["config", "id"],
              key: "configId",
              render: (id) => <Text code>{id || "N/A"}</Text>,
            },
            {
              title: "Scope",
              dataIndex: "scope",
              key: "scope",
              render: (s) => <span>{s.replace(/_/g, " ")}</span>,
            },
            {
              title: "Actions",
              key: "actions",
              width: 150,
              render: (_, record) => (
                <Space>
                  <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
                  <Popconfirm
                    title="Delete this integration?"
                    onConfirm={() => handleDelete(record.id)}
                  >
                    <Button type="link" danger>Delete</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </CmsCard>

      <Modal
        title={editing ? "Edit Integration" : "Add Integration"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveIntegrations.isPending}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Provider / Type" name="kind" rules={[{ required: true }]}>
                <Select options={INTEGRATION_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Tracking ID / Property Key" name="configId" rules={[{ required: true }]}>
                <Input placeholder="e.g. G-XXXXXX or UA-XXXXXX" />
              </Form.Item>
            </Col>
            <Col md={12} span={24}>
              <Form.Item label="Injection Scope" name="scope" rules={[{ required: true }]} initialValue="all_public_routes">
                <Select options={SCOPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col md={12} span={24}>
              <Form.Item label="Environment" name="environment" initialValue="all">
                <Select options={[
                  { label: "All Environments", value: "all" },
                  { label: "Production Only", value: "prod" },
                  { label: "Development Only", value: "dev" },
                ]} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Space>
                <Form.Item label="Enabled" name="enabled" valuePropName="checked" style={{ marginBottom: 0 }}>
                  <Switch />
                </Form.Item>
                <Text type="secondary">Injected only if enabled</Text>
              </Space>
            </Col>
            <Col span={24} style={{ marginTop: 16 }}>
              <Form.Item label="Internal Notes" name="notes">
                <Input.TextArea placeholder="Used for internal tracking..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Space>
  );
}
