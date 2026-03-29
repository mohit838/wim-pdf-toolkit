"use client";

import {
  App as AntdApp,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from "antd";
import { useState, useMemo } from "react";
import {
  CmsCard,
  CmsPageHeader,
  CmsTable,
} from "../CmsUi";
import {
  getCmsErrorMessage,
  useGuidesDraftPaged,
  useSaveGuidesDraft,
} from "@/lib/cms-api";
import type { GuideEntry } from "@/lib/cms-types";
import { LoadingPanel, ErrorPanel } from "./shared";

const { Text } = Typography;

const SEEDED_GUIDES: GuideEntry[] = [
  {
    id: "guide-1",
    slug: "ultimate-pdf-compression",
    title: "The Ultimate Guide to PDF Compression",
    excerpt: "Learn how to reduce PDF file sizes without losing quality. Perfect for email and web uploads.",
    category: "optimization",
    body: "## Why Compress PDFs?\nLarge PDF files can be difficult to share. Our guide covers...\n\n### Optimization Tips\n1. Use vector graphics where possible.\n2. Subset fonts.\n3. Downsample images.",
  },
  {
    id: "guide-2",
    slug: "secure-pdf-passwords",
    title: "How to Secure Your PDFs with Passwords",
    excerpt: "Step-by-step instructions on protecting sensitive documents with industry-standard encryption.",
    category: "security",
    body: "## Protecting Your Documents\nSecurity is paramount in the digital age. This guide explains how to add user and owner passwords...",
  },
  {
    id: "guide-3",
    slug: "merging-pdfs-for-business",
    title: "Merging PDFs for Professional Business Reports",
    excerpt: "Combine invoices, spreadsheets, and presentations into a single cohesive PDF report.",
    category: "productivity",
    body: "## Streamlining Your Workflow\nMerging multiple assets into one report saves time for your clients and colleagues...",
  },
  {
    id: "guide-4",
    slug: "scan-to-ocr-searchable",
    title: "Converting Scanned PDFs to Searchable Text (OCR)",
    excerpt: "Turn static images of text into searchable, copyable documents using modern OCR technology.",
    category: "conversion",
    body: "## The Power of OCR\nOptical Character Recognition (OCR) is a game-changer for digital archives...",
  },
  {
    id: "guide-5",
    slug: "organizing-pdf-pages",
    title: "Organizing PDF Pages: Rotate, Delete, and Move",
    excerpt: "Master the art of document manipulation. Learn how to perfectly arrange your PDF pages.",
    category: "editing",
    body: "## Document Management\nSometimes pages are upside down or unnecessary. Here is how you can reorder them...",
  },
];

export function GuidesPage() {
  const { message } = AntdApp.useApp();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<GuideEntry | null>(null);
  const [form] = Form.useForm();

  const guidesData = useGuidesDraftPaged({ page, pageSize });
  const saveGuides = useSaveGuidesDraft({
    onSuccess: () => {
      message.success("Guides draft updated.");
      setOpen(false);
    },
    onError: (error) => message.error(getCmsErrorMessage(error, "Could not save guides.")),
  });

  const allItems = useMemo(() => guidesData.data?.items || [], [guidesData.data]);

  if (guidesData.isPending) {
    return (
      <div style={{ display: "none" }}>
        <Form form={form} />
        <LoadingPanel />
      </div>
    );
  }

  if (guidesData.isError) {
    return (
      <div style={{ display: "none" }}>
        <Form form={form} />
        <ErrorPanel message="Could not load guides draft." />
      </div>
    );
  }

  const handleEdit = (record: GuideEntry) => {
    setEditing(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const next = allItems.filter((item) => item.id !== id);
    await saveGuides.mutateAsync(next);
  };

  const onFinish = async (values: any) => {
    const payload: GuideEntry = {
      id: editing?.id || `guide-${Date.now()}`,
      ...values,
    };

    const next = editing
      ? allItems.map((item) => (item.id === editing.id ? payload : item))
      : [...allItems, payload];

    await saveGuides.mutateAsync(next);
  };

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <CmsPageHeader
        eyebrow="Content"
        title="Guides & Tutorials"
        description="Create and manage helpful resources for your users. Good for building authority and SEO traffic."
        extra={
          <Button type="primary" onClick={handleAdd}>New Guide</Button>
        }
      />

      <CmsCard>
        <CmsTable
          dataSource={allItems.length > 0 ? allItems : SEEDED_GUIDES}
          rowKey="id"
          columns={[
            {
              title: "Title",
              dataIndex: "title",
              key: "title",
              render: (text) => <Text strong>{text}</Text>,
            },
            {
              title: "Category",
              dataIndex: "category",
              key: "category",
              width: 150,
              render: (cat: string) => <Tag color="blue">{cat.toUpperCase()}</Tag>,
            },
            {
              title: "Slug",
              dataIndex: "slug",
              key: "slug",
              render: (s) => <Text code>{s}</Text>,
            },
            {
              title: "Actions",
              key: "actions",
              width: 150,
              render: (_, record) => (
                <Space>
                  <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
                  <Popconfirm
                    title="Delete this Guide?"
                    onConfirm={() => handleDelete(record.id)}
                  >
                    <Button type="link" danger>Delete</Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          pagination={{
            current: page,
            pageSize,
            total: guidesData.data?.total || SEEDED_GUIDES.length,
            onChange: (p, s) => {
              setPage(p);
              setPageSize(s);
            },
          }}
        />
        {allItems.length === 0 && (
          <div style={{ marginTop: 16 }}>
            <Button 
              type="dashed" 
              block 
              onClick={() => saveGuides.mutate(SEEDED_GUIDES)}
              loading={saveGuides.isPending}
            >
              Seed Initial SEO Guides Content
            </Button>
          </div>
        )}
      </CmsCard>

      <Modal
        title={editing ? "Edit Guide" : "Add Guide"}
        open={open}
        width={800}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveGuides.isPending}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Space orientation="vertical" size={0} style={{ width: "100%" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Form.Item
                label="Title"
                name="title"
                rules={[{ required: true, message: "Please enter a title" }]}
              >
                <Input placeholder="Ultimate PDF Guide" />
              </Form.Item>
              <Form.Item
                label="URL Slug"
                name="slug"
                rules={[{ required: true, message: "Please enter a slug" }]}
              >
                <Input placeholder="pdf-guide-2024" />
              </Form.Item>
            </div>
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true }]}
            >
              <Input placeholder="Security, Productivity, etc." />
            </Form.Item>
            <Form.Item
              label="Excerpt (SEO Meta Description)"
              name="excerpt"
              rules={[{ required: true }]}
            >
              <Input.TextArea autoSize={{ minRows: 2 }} />
            </Form.Item>
            <Form.Item
              label="Full Content (Markdown Supported)"
              name="body"
              rules={[{ required: true }]}
            >
              <Input.TextArea autoSize={{ minRows: 10 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Space>
  );
}
