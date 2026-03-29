"use client";

import {
  App as AntdApp,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
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
  useFaqDraftPaged,
  useSaveFaqDraft,
} from "@/lib/cms-api";
import type { FaqEntry } from "@/lib/cms-types";
import { LoadingPanel, ErrorPanel } from "./shared";

const { Text } = Typography;

const SEEDED_FAQ: FaqEntry[] = [
  {
    id: "faq-1",
    question: "How do I merge multiple PDF files into one?",
    answer: "To merge PDFs, simply upload your files to our 'Merge PDF' tool. You can then reorder the pages as needed and click 'Merge' to create a single synchronized document.",
  },
  {
    id: "faq-2",
    question: "Is my data secure when using your online PDF tools?",
    answer: "Yes, privacy is our top priority. All uploaded files are processed locally in your browser when possible, or encrypted during transit. Files are automatically deleted from our servers after processing is complete.",
  },
  {
    id: "faq-3",
    question: "What is the maximum file size supported for conversion?",
    answer: "Our toolkit supports files up to 50MB for free users. For larger documents, please ensure you have optimized your PDF using our 'Compress PDF' tool first.",
  },
  {
    id: "faq-4",
    question: "How can I convert a PDF document to an editable Word file?",
    answer: "Use our 'PDF to Word' converter. It accurately preserves your original formatting, layouts, and images while making the text fully editable in Microsoft Word.",
  },
  {
    id: "faq-5",
    question: "Can I use these PDF tools on my mobile device or tablet?",
    answer: "Absolutely! Our PDF Toolkit is fully responsive and works seamlessly on any browser, whether you are on a smartphone, tablet, or desktop computer.",
  },
];

export function FaqPage() {
  const { message } = AntdApp.useApp();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<FaqEntry | null>(null);
  const [form] = Form.useForm();

  const faqData = useFaqDraftPaged({ page, pageSize });
  const saveFaq = useSaveFaqDraft({
    onSuccess: () => {
      message.success("FAQ draft updated.");
      setOpen(false);
    },
    onError: (error) => message.error(getCmsErrorMessage(error, "Could not save FAQ.")),
  });

  const allItems = useMemo(() => faqData.data?.items || [], [faqData.data]);

  if (faqData.isPending) {
    return (
      <div style={{ display: "none" }}>
        <Form form={form} />
        <LoadingPanel />
      </div>
    );
  }

  if (faqData.isError) {
    return (
      <div style={{ display: "none" }}>
        <Form form={form} />
        <ErrorPanel message="Could not load FAQ draft." />
      </div>
    );
  }

  const handleEdit = (record: FaqEntry) => {
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
    await saveFaq.mutateAsync(next);
  };

  const onFinish = async (values: any) => {
    const payload: FaqEntry = {
      id: editing?.id || `faq-${Date.now()}`,
      ...values,
    };

    const next = editing
      ? allItems.map((item) => (item.id === editing.id ? payload : item))
      : [...allItems, payload];

    await saveFaq.mutateAsync(next);
  };

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <CmsPageHeader
        eyebrow="Content"
        title="FAQ Management"
        description="Manage frequently asked questions to help users and improve SEO rankings."
        extra={
          <Button type="primary" onClick={handleAdd}>Add Question</Button>
        }
      />

      <CmsCard>
        <CmsTable
          dataSource={allItems.length > 0 ? allItems : SEEDED_FAQ}
          rowKey="id"
          columns={[
            {
              title: "Question",
              dataIndex: "question",
              key: "question",
              render: (text) => <Text strong>{text}</Text>,
            },
            {
              title: "Answer",
              dataIndex: "answer",
              key: "answer",
              ellipsis: true,
            },
            {
              title: "Actions",
              key: "actions",
              width: 150,
              render: (_, record) => (
                <Space>
                  <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
                  <Popconfirm
                    title="Delete this FAQ?"
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
            total: faqData.data?.total || SEEDED_FAQ.length,
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
              onClick={() => saveFaq.mutate(SEEDED_FAQ)}
              loading={saveFaq.isPending}
            >
              Seed Initial SEO FAQ Content
            </Button>
          </div>
        )}
      </CmsCard>

      <Modal
        title={editing ? "Edit FAQ" : "Add FAQ"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveFaq.isPending}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Question"
            name="question"
            rules={[{ required: true, message: "Please enter the question" }]}
          >
            <Input.TextArea autoSize={{ minRows: 2 }} />
          </Form.Item>
          <Form.Item
            label="Answer"
            name="answer"
            rules={[{ required: true, message: "Please enter the answer" }]}
          >
            <Input.TextArea autoSize={{ minRows: 4 }} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
