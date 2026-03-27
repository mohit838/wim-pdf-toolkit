"use client";

import {
  App as AntdApp,
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Space,
} from "antd";
import { useEffect, useState } from "react";
import {
  CmsActionButton,
  CmsCard,
  CmsPageHeader,
  CmsTable,
} from "../CmsUi";
import {
  getCmsErrorMessage,
  useHomepageHeroDraft,
  useSaveHomepageHeroDraft,
  useSaveSeoDraft,
  useSeoDraft,
} from "@/lib/cms-api";
import { sanitizeSeoDraft, splitLines } from "@/lib/cms-utils";
import { LoadingPanel, ErrorPanel } from "./shared";

export function SeoPage() {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const [heroForm] = Form.useForm();
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [pageForm] = Form.useForm();
  const draft = useSeoDraft();
  const homepageHeroDraft = useHomepageHeroDraft();
  const saveDraft = useSaveSeoDraft({
    onSuccess: () => message.success("SEO draft saved."),
    onError: (error) => message.error(getCmsErrorMessage(error, "Could not save the SEO draft.")),
  });
  const saveHomepageHeroDraft = useSaveHomepageHeroDraft({
    onSuccess: () => message.success("Homepage hero draft saved."),
    onError: (error) => message.error(getCmsErrorMessage(error, "Could not save homepage hero draft.")),
  });

  useEffect(() => {
    if (draft.data) {
      form.setFieldsValue(draft.data);
    }
  }, [draft.data, form]);

  useEffect(() => {
    if (homepageHeroDraft.data) {
      heroForm.setFieldsValue({
        hero: homepageHeroDraft.data.hero,
        pillsText: homepageHeroDraft.data.hero.pills.join("\n"),
      });
    }
  }, [homepageHeroDraft.data, heroForm]);

  if (draft.isPending || homepageHeroDraft.isPending) {
    return (
      <>
        <Form component={false} form={form} />
        <Form component={false} form={heroForm} />
        <Form component={false} form={pageForm} />
        <LoadingPanel />
      </>
    );
  }

  if (draft.isError || homepageHeroDraft.isError) {
    return (
      <>
        <Form component={false} form={form} />
        <Form component={false} form={heroForm} />
        <Form component={false} form={pageForm} />
        <ErrorPanel message="Could not load SEO or homepage draft." />
      </>
    );
  }

  const pages = Object.entries(draft.data.seo.pages).map(([key, value]) => ({ key, ...value }));

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <CmsPageHeader
        eyebrow="Search"
        title="SEO"
        description="Edit global SEO defaults and route-level metadata used on the public frontend."
        extra={
          <CmsActionButton loading={saveDraft.isPending} onClick={() => form.submit()}>
            Save draft
          </CmsActionButton>
        }
      />

      <CmsCard title="Homepage Hero Copy">
        <Form
          form={heroForm}
          layout="vertical"
          onFinish={(values) => {
            const pills = splitLines(values.pillsText || "");
            const next = {
              hero: {
                ...homepageHeroDraft.data!.hero,
                ...values.hero,
                pills,
              },
            };
            void saveHomepageHeroDraft.mutateAsync(next);
          }}
        >
          <Row gutter={16}>
            <Col md={8} span={24}>
              <Form.Item label="Badge suffix" name={["hero", "badgeCountSuffix"]}>
                <Input placeholder="TOOLS READY" />
              </Form.Item>
            </Col>
            <Col md={8} span={24}>
              <Form.Item label="Title lead" name={["hero", "titleLead"]}>
                <Input placeholder="The complete" />
              </Form.Item>
            </Col>
            <Col md={8} span={24}>
              <Form.Item label="Title highlight" name={["hero", "titleHighlight"]}>
                <Input placeholder="PDF toolkit" />
              </Form.Item>
            </Col>
            <Col md={8} span={24}>
              <Form.Item label="Title tail" name={["hero", "titleTail"]}>
                <Input placeholder="you need" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Hero description" name={["hero", "description"]}>
                <Input.TextArea autoSize={{ minRows: 3 }} />
              </Form.Item>
            </Col>
            <Col md={12} span={24}>
              <Form.Item label="Primary action prefix" name={["hero", "primaryActionPrefix"]}>
                <Input placeholder="Open" />
              </Form.Item>
            </Col>
            <Col md={12} span={24}>
              <Form.Item label="Secondary action label" name={["hero", "secondaryActionLabel"]}>
                <Input placeholder="Browse all tools" />
              </Form.Item>
            </Col>
            <Col md={12} span={24}>
              <Form.Item label="Ready tools suffix" name={["hero", "readyToolsSuffix"]}>
                <Input placeholder="ready tools across editing, security, and conversion workflows." />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Hero chips (one per line)" name="pillsText">
                <Input.TextArea autoSize={{ minRows: 4 }} />
              </Form.Item>
            </Col>
          </Row>
          <CmsActionButton htmlType="submit" loading={saveHomepageHeroDraft.isPending}>
            Save hero copy
          </CmsActionButton>
        </Form>
      </CmsCard>

      <CmsCard>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            void saveDraft.mutateAsync(sanitizeSeoDraft(values));
          }}
        >
          <Row gutter={16}>
            <Col md={12} span={24}>
              <Form.Item label="Default title" name={["seo", "site", "defaultTitle"]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col md={12} span={24}>
              <Form.Item label="Title template" name={["seo", "site", "titleTemplate"]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Description" name={["seo", "site", "description"]}>
                <Input.TextArea autoSize={{ minRows: 4 }} />
              </Form.Item>
            </Col>
          </Row>

          <CmsCard className="cms-inner-card" title="Route metadata">
            <CmsTable
              columns={[
                { title: "Key", dataIndex: "key", key: "key" },
                { title: "Path", dataIndex: "path", key: "path" },
                { title: "Title", dataIndex: "title", key: "title" },
                {
                  title: "Actions",
                  key: "actions",
                  render: (_, row) => (
                    <Button
                      onClick={() => {
                        setEditingKey(row.key);
                        pageForm.setFieldsValue(row);
                        setPageModalOpen(true);
                      }}
                      type="link"
                    >
                      Edit
                    </Button>
                  ),
                },
              ]}
              dataSource={pages}
            />
          </CmsCard>
        </Form>
      </CmsCard>

      <Modal
        forceRender
        onCancel={() => setPageModalOpen(false)}
        onOk={() => pageForm.submit()}
        open={pageModalOpen}
        okText="Update route"
        title={editingKey ? `Edit ${editingKey}` : "Edit route"}
      >
        <Form
          form={pageForm}
          layout="vertical"
          onFinish={(values) => {
            if (!editingKey) {
              return;
            }
            const nextDraft = sanitizeSeoDraft({
              seo: {
                ...draft.data.seo,
                pages: {
                  ...draft.data.seo.pages,
                  [editingKey]: {
                    ...draft.data.seo.pages[editingKey],
                    ...values,
                    keywords: splitLines(values.keywords || ""),
                  },
                },
              },
            });
            void saveDraft.mutateAsync(nextDraft).then(() => setPageModalOpen(false));
          }}
        >
          <Form.Item label="Title" name="title">
            <Input />
          </Form.Item>
          <Form.Item label="Path" name="path">
            <Input />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea autoSize={{ minRows: 3 }} />
          </Form.Item>
          <Form.Item label="Keywords (comma or newline separated)" name="keywords">
            <Input.TextArea autoSize={{ minRows: 3 }} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
