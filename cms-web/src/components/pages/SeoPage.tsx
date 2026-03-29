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
  useSaveSeoDraft,
  useSeoDraft,
} from "@/lib/cms-api";
import { sanitizeSeoDraft, splitLines } from "@/lib/cms-utils";
import { LoadingPanel, ErrorPanel } from "./shared";

export function SeoPage() {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [pageForm] = Form.useForm();
  
  const draft = useSeoDraft();
  const saveDraft = useSaveSeoDraft({
    onSuccess: () => message.success("SEO draft saved."),
    onError: (error) => message.error(getCmsErrorMessage(error, "Could not save the SEO draft.")),
  });

  useEffect(() => {
    if (draft.data) {
      form.setFieldsValue(draft.data);
    }
  }, [draft.data, form]);

  if (draft.isPending) {
    return (
      <>
        <Form component={false} form={form} />
        <Form component={false} form={pageForm} />
        <LoadingPanel />
      </>
    );
  }

  if (draft.isError) {
    return (
      <>
        <Form component={false} form={form} />
        <Form component={false} form={pageForm} />
        <ErrorPanel message="Could not load SEO draft." />
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

      <CmsCard title="Global SEO Strategy">
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
                  render: (_, row: any) => (
                    <Button
                      onClick={() => {
                        setEditingKey(row.key);
                        pageForm.setFieldsValue({
                          ...row,
                          keywords: (row.keywords || []).join("\n"),
                        });
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
              pagination={false}
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
