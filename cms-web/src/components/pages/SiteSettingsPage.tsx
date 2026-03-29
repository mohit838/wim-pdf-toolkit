"use client";

import {
  App as AntdApp,
  Button,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Tabs,
  Typography,
} from "antd";
import { useEffect, useMemo } from "react";
import {
  CmsActionButton,
  CmsCard,
  CmsPageHeader,
} from "../CmsUi";
import {
  getCmsErrorMessage,
  useHomepageDraft,
  useSaveHomepageDraft,
  useSiteShellDraft,
  useSaveSiteShellDraft,
  useToolsDraft,
} from "@/lib/cms-api";
import { splitLines } from "@/lib/cms-utils";
import { LoadingPanel, ErrorPanel } from "./shared";

const { Text } = Typography;

export function SiteSettingsPage() {
  const { message } = AntdApp.useApp();
  const [brandingForm] = Form.useForm();
  const [homepageForm] = Form.useForm();
  const [footerForm] = Form.useForm();
  const [scriptsForm] = Form.useForm();

  const siteShell = useSiteShellDraft();
  const homepage = useHomepageDraft();
  const tools = useToolsDraft();

  const saveSiteShell = useSaveSiteShellDraft({
    onSuccess: () => message.success("Site settings saved."),
    onError: (error) => message.error(getCmsErrorMessage(error, "Could not save settings.")),
  });

  const saveHomepage = useSaveHomepageDraft({
    onSuccess: () => message.success("Homepage content saved."),
    onError: (error) => message.error(getCmsErrorMessage(error, "Could not save homepage settings.")),
  });

  const toolOptions = useMemo(() => {
    if (!tools.data) return [];
    return Object.entries(tools.data).map(([id, tool]) => ({
      label: `${tool.nav.label} (${id})`,
      value: id,
    }));
  }, [tools.data]);

  useEffect(() => {
    if (siteShell.data) {
      brandingForm.setFieldsValue(siteShell.data);
      footerForm.setFieldsValue(siteShell.data);
      scriptsForm.setFieldsValue(siteShell.data);
    }
  }, [siteShell.data, brandingForm, footerForm, scriptsForm]);

  useEffect(() => {
    if (homepage.data) {
      homepageForm.setFieldsValue({
        ...homepage.data,
        pillsText: (homepage.data.home.hero.pills || []).join("\n"),
      });
    }
  }, [homepage.data, homepageForm]);

  if (siteShell.isPending || homepage.isPending || tools.isPending) {
    return (
      <>
        <div style={{ display: "none" }}>
          <Form form={brandingForm} />
          <Form form={homepageForm} />
          <Form form={footerForm} />
          <Form form={scriptsForm} />
        </div>
        <LoadingPanel />
      </>
    );
  }

  if (siteShell.isError || homepage.isError || tools.isError) {
    return (
      <>
        <div style={{ display: "none" }}>
          <Form form={brandingForm} />
          <Form form={homepageForm} />
          <Form form={footerForm} />
          <Form form={scriptsForm} />
        </div>
        <ErrorPanel message="Could not load site settings." />
      </>
    );
  }

  const items = [
    {
      key: "identity",
      label: "Branding & Identity",
      children: (
        <Space orientation="vertical" size={20} style={{ width: "100%" }}>
          <CmsCard title="Public Identity">
            <Form
              form={brandingForm}
              layout="vertical"
              onFinish={(values) => void saveSiteShell.mutateAsync({ ...siteShell.data!, ...values })}
            >
              <Row gutter={16}>
                <Col md={12} span={24}>
                  <Form.Item label="Site Name (Title)" name={["branding", "name"]} rules={[{ required: true }]}>
                    <Input placeholder="e.g. PDF Toolkit" />
                  </Form.Item>
                </Col>
                <Col md={12} span={24}>
                  <Form.Item label="Short Name" name={["branding", "shortName"]}>
                    <Input placeholder="e.g. Toolkit" />
                  </Form.Item>
                </Col>
                <Col md={12} span={24}>
                  <Form.Item label="Legal Entity Name" name={["branding", "legalName"]}>
                    <Input placeholder="e.g. PDF Toolkit Inc." />
                  </Form.Item>
                </Col>
                <Col md={12} span={24}>
                  <Form.Item label="Author / Attribution" name={["branding", "authorName"]}>
                    <Input placeholder="e.g. PDF Toolkit Team" />
                  </Form.Item>
                </Col>
              </Row>

              <Text strong style={{ display: "block", marginBottom: 12 }}>Contact Details</Text>
              <Row gutter={16}>
                <Col md={12} span={24}>
                  <Form.Item label="Support Email" name={["contact", "email"]}>
                    <Input placeholder="support@example.com" />
                  </Form.Item>
                </Col>
              </Row>

              <CmsActionButton htmlType="submit" loading={saveSiteShell.isPending}>
                Save Branding
              </CmsActionButton>
            </Form>
          </CmsCard>
        </Space>
      ),
    },
    {
      key: "homepage",
      label: "Homepage Content",
      children: (
        <Space orientation="vertical" size={20} style={{ width: "100%" }}>
          <Form
            form={homepageForm}
            layout="vertical"
            onFinish={(values) => {
              const pills = splitLines(values.pillsText || "");
              const next = {
                ...values,
                home: {
                  ...values.home,
                  hero: {
                    ...values.home.hero,
                    pills,
                  },
                },
              };
              void saveHomepage.mutateAsync(next);
            }}
          >
            <CmsCard title="Hero Section">
              <Row gutter={16}>
                <Col md={8} span={24}>
                  <Form.Item label="Badge Text" name={["home", "hero", "badgeCountSuffix"]}>
                    <Input placeholder="TOOLS READY" />
                  </Form.Item>
                </Col>
                <Col md={16} span={24}>
                  <Form.Item label="Status Message" name={["home", "hero", "readyToolsSuffix"]}>
                    <Input placeholder="tools available now..." />
                  </Form.Item>
                </Col>
                <Col md={8} span={24}>
                  <Form.Item label="Title Lead" name={["home", "hero", "titleLead"]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col md={8} span={24}>
                  <Form.Item label="Title Highlight" name={["home", "hero", "titleHighlight"]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col md={8} span={24}>
                  <Form.Item label="Title Tail" name={["home", "hero", "titleTail"]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="Brief Description" name={["home", "hero", "description"]}>
                    <Input.TextArea autoSize={{ minRows: 2 }} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="Feature Tags (one per line)" name="pillsText">
                    <Input.TextArea autoSize={{ minRows: 4 }} />
                  </Form.Item>
                </Col>
              </Row>
            </CmsCard>

            <CmsCard title="Tool Grids" style={{ marginTop: 24 }}>
              <Form.Item 
                label="Quick Start Tools" 
                name={["home", "quickStart", "toolIds"]}
              >
                <Select mode="multiple" options={toolOptions} />
              </Form.Item>

              <Text strong style={{ display: "block", marginBottom: 12, marginTop: 24 }}>Homepage Sections</Text>
              <Form.List name={["home", "sections"]}>
                {(fields, { add, remove }) => (
                  <Space orientation="vertical" size={16} style={{ width: "100%" }}>
                    {fields.map((field) => (
                      <CmsCard className="cms-nested-edit-card" key={field.key}>
                        <Row gutter={12}>
                          <Col md={8} span={24}>
                            <Form.Item label="Label" name={[field.name, "accent"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col md={16} span={24}>
                            <Form.Item label="Heading" name={[field.name, "eyebrow"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item label="Tool Set" name={[field.name, "toolIds"]}>
                              <Select mode="multiple" options={toolOptions} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Button danger onClick={() => remove(field.name)} size="small">Remove Section</Button>
                      </CmsCard>
                    ))}
                    <Button onClick={() => add({ id: `section-${Date.now()}`, accent: "Featured", toolIds: [] })}>
                      Add Homepage Section
                    </Button>
                  </Space>
                )}
              </Form.List>
            </CmsCard>

            <div style={{ marginTop: 24 }}>
              <CmsActionButton htmlType="submit" loading={saveHomepage.isPending}>
                Save Homepage
              </CmsActionButton>
            </div>
          </Form>
        </Space>
      ),
    },
    {
      key: "footer",
      label: "Footer Layout",
      children: (
        <Space orientation="vertical" size={20} style={{ width: "100%" }}>
          <Form
            form={footerForm}
            layout="vertical"
            onFinish={(values) => void saveSiteShell.mutateAsync({ ...siteShell.data!, ...values })}
          >
            <CmsCard title="Footer Messaging">
              <Row gutter={16}>
                <Col md={12} span={24}>
                  <Form.Item label="Eyebrow" name={["footer", "eyebrow"]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col md={12} span={24}>
                  <Form.Item label="Headline" name={["footer", "headline"]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="Description" name={["footer", "description"]}>
                    <Input.TextArea autoSize={{ minRows: 3 }} />
                  </Form.Item>
                </Col>
              </Row>
            </CmsCard>

            <CmsCard title="Footer Navigation Columns" style={{ marginTop: 24 }}>
              <Form.List name={["footer", "sections"]}>
                {(fields, { add, remove }) => (
                  <Space orientation="vertical" size={16} style={{ width: "100%" }}>
                    {fields.map((field) => (
                      <CmsCard className="cms-nested-edit-card" key={field.key}>
                        <Row gutter={12}>
                          <Col span={24}>
                            <Form.Item label="Column Title" name={[field.name, "title"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item label="Links (Tools)" name={[field.name, "toolIds"]}>
                              <Select mode="multiple" options={toolOptions} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Button danger onClick={() => remove(field.name)} size="small">Remove Column</Button>
                      </CmsCard>
                    ))}
                    <Button onClick={() => add({ id: `footer-${Date.now()}`, title: "Resources", toolIds: [] })}>
                      Add Footer Column
                    </Button>
                  </Space>
                )}
              </Form.List>

              <Text strong style={{ display: "block", marginBottom: 12, marginTop: 24 }}>Bottom Text</Text>
              <Form.Item name={["footer", "bottomNote"]}>
                <Input.TextArea placeholder="Drafting credits, copyright, etc." />
              </Form.Item>
            </CmsCard>

            <div style={{ marginTop: 24 }}>
              <CmsActionButton htmlType="submit" loading={saveSiteShell.isPending}>
                Save Footer
              </CmsActionButton>
            </div>
          </Form>
        </Space>
      ),
    },
    {
      key: "scripts",
      label: "Custom Scripts",
      children: (
        <Space orientation="vertical" size={20} style={{ width: "100%" }}>
          <CmsCard title="Global HTML Injection">
            <Form
              form={scriptsForm}
              layout="vertical"
              onFinish={(values) => void saveSiteShell.mutateAsync({ ...siteShell.data!, ...values })}
            >
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item 
                    label="Head Scripts (Custom CSS, Meta tags, Head JS)" 
                    name={["system", "customHeadHtml"]}
                    extra="Injected into the <head> of all public pages. Examples: <link rel='stylesheet' ...>, <style>, <script src='...' defer>"
                  >
                    <Input.TextArea autoSize={{ minRows: 6 }} placeholder="<style>...</style>" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item 
                    label="Body Scripts (Analytics, Chatbots, Ad trackers)" 
                    name={["system", "customBodyHtml"]}
                    extra="Injected at the start of the <body>. Examples: <script>...</script>, <iframe ...>"
                  >
                    <Input.TextArea autoSize={{ minRows: 6 }} placeholder="<script>...</script>" />
                  </Form.Item>
                </Col>
              </Row>

              <CmsActionButton htmlType="submit" loading={saveSiteShell.isPending}>
                Save Scripts
              </CmsActionButton>
            </Form>
          </CmsCard>
        </Space>
      ),
    },
  ];

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <CmsPageHeader
        eyebrow="Configuration"
        title="Site Settings"
        description="Global branding, logo identity, and footer navigation layout."
      />
      <Tabs items={items} type="card" />
    </Space>
  );
}
