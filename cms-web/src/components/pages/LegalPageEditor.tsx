"use client";

import {
  App as AntdApp,
  Button,
  Col,
  Form,
  Input,
  Row,
  Space,
} from "antd";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RichTextEditor from "../RichTextEditor";
import {
  CmsActionButton,
  CmsCard,
  CmsPageHeader,
} from "../CmsUi";
import {
  getCmsErrorMessage,
  useLegalPagesDraft,
  useSaveLegalPagesDraft,
} from "@/lib/cms-api";
import { createEmptyLegalPage, formatLabel, slugify } from "@/lib/cms-utils";
import { LoadingPanel, ErrorPanel } from "./shared";

export function LegalPageEditor({ slug }: { slug: string }) {
  const { message } = AntdApp.useApp();
  const router = useRouter();
  const [form] = Form.useForm();
  const isNewCustomPage = slug === "new";
  const draft = useLegalPagesDraft();
  const saveDraft = useSaveLegalPagesDraft({
    onSuccess: () => message.success("Legal page draft saved."),
    onError: (error) => message.error(getCmsErrorMessage(error, "Could not save the legal page draft.")),
  });

  const page = useMemo(() => {
    return draft.data?.[slug] || createEmptyLegalPage(isNewCustomPage ? "custom-page" : slug);
  }, [draft.data, slug, isNewCustomPage]);

  useEffect(() => {
    if (!draft.isPending && !draft.isError && page) {
      form.setFieldsValue(page);
    }
  }, [draft.isError, draft.isPending, form, page]);

  if (draft.isPending) {
    return (
      <>
        <Form component={false} form={form} />
        <LoadingPanel />
      </>
    );
  }

  if (draft.isError) {
    return (
      <>
        <Form component={false} form={form} />
        <ErrorPanel message="Could not load the legal page draft." />
      </>
    );
  }

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <CmsPageHeader
        eyebrow="Content"
        title={`Legal page: ${formatLabel(slug)}`}
        description="Use the editor for the main body and section content only. Keep headings and descriptions in plain inputs."
        extra={
          <Space>
            <Link href="/legal-pages"><Button>Back</Button></Link>
            <CmsActionButton loading={saveDraft.isPending} onClick={() => form.submit()}>
              Save draft
            </CmsActionButton>
          </Space>
        }
      />
      <CmsCard>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            const nextSlug = isNewCustomPage
              ? slugify(String(values.slug || ""))
              : slug;

            if (!nextSlug) {
              message.error("Please provide a valid slug.");
              return;
            }

            const nextLegalPages = {
              ...draft.data,
              [nextSlug]: {
                ...page,
                ...values,
                slug: nextSlug,
                sections: values.sections || [],
              },
            };
            void saveDraft.mutateAsync(nextLegalPages).then(() => {
              if (isNewCustomPage) {
                router.replace(`/legal-pages/${nextSlug}`);
              }
            });
          }}
        >
          <Row gutter={16}>
            <Col md={8} span={24}>
              <Form.Item
                label="Slug"
                name="slug"
                rules={[{ required: true, message: "Slug is required." }]}
              >
                <Input disabled={!isNewCustomPage} />
              </Form.Item>
            </Col>
            <Col md={8} span={24}>
              <Form.Item label="Eyebrow" name="eyebrow">
                <Input />
              </Form.Item>
            </Col>
            <Col md={8} span={24}>
              <Form.Item label="Title" name="title">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Description" name="description">
                <Input.TextArea autoSize={{ minRows: 3 }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Lead body" name="body">
                <RichTextEditor label="Lead body" onChange={(next) => form.setFieldValue("body", next)} value={form.getFieldValue("body") || ""} />
              </Form.Item>
            </Col>
          </Row>

          <CmsCard className="cms-inner-card" title="Sections">
            <Form.List name="sections">
              {(fields, { add, remove }) => (
                <Space orientation="vertical" size={16} style={{ width: "100%" }}>
                  {fields.map((field) => (
                    <CmsCard className="cms-nested-edit-card" key={field.key}>
                      <Row gutter={12}>
                        <Col md={8} span={24}>
                          <Form.Item label="Section id" name={[field.name, "id"]}>
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col md={16} span={24}>
                          <Form.Item label="Heading" name={[field.name, "heading"]}>
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col span={24}>
                          <Form.Item noStyle shouldUpdate>
                            {() => (
                              <RichTextEditor
                                label="Body"
                                onChange={(next) => {
                                  const sections = [...(form.getFieldValue("sections") || [])];
                                  sections[field.name] = { ...sections[field.name], body: next };
                                  form.setFieldValue("sections", sections);
                                }}
                                value={form.getFieldValue(["sections", field.name, "body"]) || ""}
                              />
                            )}
                          </Form.Item>
                        </Col>
                      </Row>
                      <Button danger onClick={() => remove(field.name)}>
                        Remove section
                      </Button>
                    </CmsCard>
                  ))}
                  <Button onClick={() => add({ id: `section-${Date.now()}`, heading: "New section", body: "" })}>Add section</Button>
                </Space>
              )}
            </Form.List>
          </CmsCard>
        </Form>
      </CmsCard>
    </Space>
  );
}
