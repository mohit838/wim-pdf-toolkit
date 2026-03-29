"use client";

import {
  App as AntdApp,
  Button,
  Col,
  Collapse,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
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
} from "../../CmsUi";
import {
  AD_PROVIDER_OPTIONS,
  AD_SCOPE_OPTIONS,
  AD_SLOT_PRESETS,
  ENVIRONMENT_OPTIONS,
} from "@/lib/cms-constants";
import {
  getCmsErrorMessage,
  useAdsDraft,
  useAdsPlacementsPaged,
  useCmsSession,
  useSaveAdsDraft,
} from "@/lib/cms-api";
import type { RuntimeAdPlacement } from "@/lib/cms-types";
import {
  createEmptyAdPlacement,
  formatLabel,
  sanitizeAdsDraft,
  splitLines,
} from "@/lib/cms-utils";
import { LoadingPanel, ErrorPanel, splitCategories } from "../shared";

const { Text } = Typography;

const DEFAULT_SLOT_SIZE_COPY = {
  desktop: "728x90",
  tablet: "728x90",
  mobile: "320x100",
} as const;

const SLOT_RENDER_CONTEXT: Record<string, { scope: RuntimeAdPlacement["scopes"][number]; categories: string[] }> = {
  home_before_title: { scope: "home", categories: ["homepage", "hero"] },
  home_after_title: { scope: "home", categories: ["homepage", "hero"] },
  home_right_rail: { scope: "home", categories: ["homepage", "quick-start"] },
  home_between_1: { scope: "home", categories: ["homepage", "core-tools"] },
  home_between_2: { scope: "home", categories: ["homepage", "security-tools"] },
  home_mid: { scope: "home", categories: ["homepage"] },
  tool_before_title: { scope: "tool_page", categories: ["tool"] },
  tool_after_header: { scope: "tool_page", categories: ["tool"] },
  tool_after_panel: { scope: "tool_page", categories: ["tool"] },
  guide_before_title: { scope: "guide", categories: ["guides"] },
  guide_sidebar: { scope: "guide", categories: ["guides"] },
  guide_after_content: { scope: "guide", categories: ["guides"] },
  guides_index_before_title: { scope: "guide", categories: ["guides"] },
  guides_index_after_grid: { scope: "guide", categories: ["guides"] },
  faq_before_title: { scope: "faq", categories: ["faq"] },
  faq_after_content: { scope: "faq", categories: ["faq"] },
  legal_before_title: { scope: "legal", categories: ["legal"] },
  legal_sidebar: { scope: "legal", categories: ["legal"] },
  legal_after_content: { scope: "legal", categories: ["legal"] },
  footer_promo: { scope: "footer", categories: ["footer"] },
};

function isSeededDemoPlacement(placement: RuntimeAdPlacement): boolean {
  const haystack = [
    placement.name,
    String(placement.config.title || ""),
    String(placement.config.headline || ""),
    String(placement.config.description || ""),
    String(placement.config.body || ""),
  ].join(" ").toLowerCase();

  return haystack.includes("demo ad") || haystack.includes("seeded test ad");
}

function TemplateBox({
  label,
  adSlot,
  tall,
  occupied,
}: {
  label: string;
  adSlot?: string;
  tall?: boolean;
  occupied?: boolean;
}) {
  return (
    <div className={`cms-ad-template-box${adSlot ? " cms-ad-template-box-ad" : ""}${tall ? " cms-ad-template-box-tall" : ""}`}>
      <span>{label}</span>
      {adSlot ? (
        <div className="cms-ad-template-slot-meta">
          <code>{adSlot}</code>
          <small>
            Desktop {DEFAULT_SLOT_SIZE_COPY.desktop}<br />
            Tablet {DEFAULT_SLOT_SIZE_COPY.tablet}<br />
            Mobile {DEFAULT_SLOT_SIZE_COPY.mobile}
          </small>
          <em className={occupied ? "is-occupied" : "is-free"}>{occupied ? "Occupied" : "Free"}</em>
        </div>
      ) : null}
    </div>
  );
}

function hasRenderablePlacementConfig(placement: RuntimeAdPlacement): boolean {
  if (!placement.enabled || isSeededDemoPlacement(placement)) {
    return false;
  }

  if (placement.provider.startsWith("adsense")) {
    const publisherId = String(placement.config.publisherId || "").trim();
    const adSlot = String(placement.config.adSlot || "").trim();
    return Boolean(publisherId && adSlot);
  }

  if (placement.provider === "google_ad_manager") {
    const unitPath = String(placement.config.unitPath || "").trim();
    return unitPath.startsWith("/");
  }

  if (placement.provider === "custom_banner" || placement.provider === "custom_card") {
    const href = String(placement.config.href || "").trim();
    return Boolean(href);
  }

  return false;
}

export function AdsPlacementsPage() {
  const { message } = AntdApp.useApp();
  const { data: session } = useCmsSession();
  const isSuperadmin = session?.role === "SUPERADMIN";

  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [enabledFilter, setEnabledFilter] = useState<"all" | "active" | "inactive">("all");
  const [providerFilter, setProviderFilter] = useState<string | undefined>(undefined);
  const [environmentFilter, setEnvironmentFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();

  const draft = useAdsDraft();
  const placementsList = useAdsPlacementsPaged({
    q: query.trim() || undefined,
    provider: providerFilter,
    environment: environmentFilter,
    enabled: enabledFilter === "all" ? undefined : enabledFilter === "active",
    page,
    pageSize,
  });

  const saveDraft = useSaveAdsDraft({
    onSuccess: () => message.success("Ads draft saved."),
    onError: (error) => message.error(getCmsErrorMessage(error, "Could not save the ads draft.")),
  });

  const selectedProvider = Form.useWatch("provider", form);

  if (draft.isPending || placementsList.isPending) {
    return (
      <>
        <Form component={false} form={form} />
        <LoadingPanel />
      </>
    );
  }

  if (draft.isError || placementsList.isError) {
    return (
      <>
        <Form component={false} form={form} />
        <ErrorPanel message="Could not load the ad placements draft." />
      </>
    );
  }

  const placements = draft.data.adPlacements;
  const listData = placementsList.data;
  const presetBySlotId = new Map<string, (typeof AD_SLOT_PRESETS)[number]>(AD_SLOT_PRESETS.map((preset) => [preset.id, preset]));
  const placementsBySlot = new Map<string, RuntimeAdPlacement[]>();

  for (const placement of placements) {
    const bucket = placementsBySlot.get(placement.slotId) || [];
    bucket.push(placement);
    placementsBySlot.set(placement.slotId, bucket);
  }

  const isOccupied = (slotId: string) => {
    const slotContext = SLOT_RENDER_CONTEXT[slotId];
    return (placementsBySlot.get(slotId) || []).some((placement) => {
      if (!hasRenderablePlacementConfig(placement)) {
        return false;
      }

      if (slotContext && !placement.scopes.includes(slotContext.scope)) {
        return false;
      }

      if (slotContext && slotContext.categories.length > 0 && placement.categories.length > 0) {
        return slotContext.categories.some((category) => placement.categories.includes(category));
      }

      return true;
    });
  };

  const deletePlacement = async (row: RuntimeAdPlacement) => {
    const next = placements.filter((item) => item.id !== row.id);
    await saveDraft.mutateAsync(sanitizeAdsDraft({ ...draft.data, adPlacements: next }));
    await placementsList.refetch();
    message.success("Placement deleted.");
  };


  const renderProviderFields = () => {
    if (selectedProvider?.startsWith("adsense")) {
      return (
        <Row gutter={8}>
          <Col span={12}>
            <Form.Item label="Publisher ID" name={["config", "publisherId"]} extra="ca-pub-XXXX">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Ad Slot" name={["config", "adSlot"]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Format" name={["config", "format"]} initialValue="auto">
              <Select options={[{ label: "Auto", value: "auto" }, { label: "Fluid", value: "fluid" }, { label: "Rectangle", value: "rectangle" }]} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Full Width Responsive" name={["config", "fullWidthResponsive"]} valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      );
    }

    if (selectedProvider === "google_ad_manager") {
      return (
        <Row gutter={8}>
          <Col span={24}>
            <Form.Item label="Unit Path" name={["config", "unitPath"]} extra="/12345/home_top">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Sizes" name={["config", "sizes"]} extra="e.g. [728, 90] or fluid">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      );
    }

    if (selectedProvider?.startsWith("custom_")) {
      return (
        <Row gutter={8}>
          <Col span={24}>
            <Form.Item label="Destination URL" name={["config", "href"]}>
              <Input placeholder="https://..." />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Title" name={["config", "title"]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="CTA Label" name={["config", "ctaLabel"]}>
              <Input />
            </Form.Item>
          </Col>
        </Row>
      );
    }

    return (
      <Form.Item label="Raw Config (key=value per line)" name="configText" extra="Use this for advanced or unsupported providers.">
        <Input.TextArea autoSize={{ minRows: 4 }} />
      </Form.Item>
    );
  };

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <CmsPageHeader
        eyebrow="Ads"
        title="Placements"
        description="Manage ad slots with clear draft and live sync status. Ready means config is valid; Live means it is already published to web frontend."
        extra={
          <Space wrap>
            <Input.Search
              allowClear
              enterButton
              size="large"
              placeholder="Search name, slot, provider, notes"
              value={searchText}
              style={{ minWidth: 340 }}
              onChange={(event) => {
                const value = event.target.value;
                setSearchText(value);
                if (!value.trim()) {
                  setQuery("");
                  setPage(1);
                }
              }}
              onSearch={(value) => {
                setQuery(value.trim());
                setPage(1);
              }}
            />
            <Select
              allowClear
              size="large"
              placeholder="Provider"
              value={providerFilter}
              style={{ width: 200 }}
              options={AD_PROVIDER_OPTIONS}
              onChange={(value) => {
                setProviderFilter(value);
                setPage(1);
              }}
            />
            <Select
              allowClear
              size="large"
              placeholder="Environment"
              value={environmentFilter}
              style={{ width: 180 }}
              options={ENVIRONMENT_OPTIONS}
              onChange={(value) => {
                setEnvironmentFilter(value);
                setPage(1);
              }}
            />
            <Select
              size="large"
              value={enabledFilter}
              style={{ width: 180 }}
              options={[
                { value: "all", label: "All statuses" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              onChange={(value) => {
                setEnabledFilter(value);
                setPage(1);
              }}
            />
            <Button
              onClick={() => {
                form.setFieldsValue({ ...createEmptyAdPlacement(), categoriesText: "homepage", scopes: ["home"] });
                setOpen(true);
              }}
            >
              Add placement
            </Button>
          </Space>
        }
      />

      <CmsCard>
        <Collapse
          defaultActiveKey={[]}
          items={[
            {
              key: "visual-layout",
              label: "Visual page layout (slot short codes)",
              children: (
                <>
                  <Text className="cms-page-description">
                    Simple page wireframes for non-technical admins. Dashed boxes are ad slots and show short codes only. Occupied means this slot has at least one ad that can actually show on frontend.
                  </Text>
                  <div className="cms-ad-layout-templates">
                    <div className="cms-ad-template">
                      <h4>Homepage</h4>
                      <div className="cms-ad-template-frame">
                        <TemplateBox label="Hero content (no ad in hero)" />
                        <TemplateBox label="Post-hero primary" adSlot="home_before_title" occupied={isOccupied("home_before_title")} />
                        <TemplateBox label="Post-hero secondary" adSlot="home_after_title" occupied={isOccupied("home_after_title")} />
                        <TemplateBox label="Between section 1 and 2" adSlot="home_between_1" occupied={isOccupied("home_between_1")} />
                        <TemplateBox label="Between section 2 and 3" adSlot="home_between_2" occupied={isOccupied("home_between_2")} />
                        <TemplateBox label="Homepage bottom banner" adSlot="home_mid" occupied={isOccupied("home_mid")} />
                      </div>
                    </div>

                    <div className="cms-ad-template">
                      <h4>Tool Page</h4>
                      <div className="cms-ad-template-frame">
                        <TemplateBox label="Before tool title" adSlot="tool_before_title" occupied={isOccupied("tool_before_title")} />
                        <TemplateBox label="Tool heading / intro block" />
                        <TemplateBox label="After tool header" adSlot="tool_after_header" occupied={isOccupied("tool_after_header")} />
                        <TemplateBox label="Tool workflow panel" tall />
                        <TemplateBox label="After tool panel" adSlot="tool_after_panel" occupied={isOccupied("tool_after_panel")} />
                      </div>
                    </div>

                    <div className="cms-ad-template">
                      <h4>Guide Page</h4>
                      <div className="cms-ad-template-frame">
                        <div className="cms-ad-template-grid">
                          <div className="cms-ad-template-stack">
                            <TemplateBox label="Before guide title" adSlot="guide_before_title" occupied={isOccupied("guide_before_title")} />
                            <TemplateBox label="Guide content area" tall />
                            <TemplateBox label="After guide content" adSlot="guide_after_content" occupied={isOccupied("guide_after_content")} />
                          </div>
                          <div className="cms-ad-template-stack">
                            <TemplateBox label="Guide sidebar slot" adSlot="guide_sidebar" tall occupied={isOccupied("guide_sidebar")} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="cms-ad-template">
                      <h4>Legal Page</h4>
                      <div className="cms-ad-template-frame">
                        <div className="cms-ad-template-grid">
                          <div className="cms-ad-template-stack">
                            <TemplateBox label="Before legal title" adSlot="legal_before_title" occupied={isOccupied("legal_before_title")} />
                            <TemplateBox label="Legal content area" tall />
                            <TemplateBox label="After legal content" adSlot="legal_after_content" occupied={isOccupied("legal_after_content")} />
                          </div>
                          <div className="cms-ad-template-stack">
                            <TemplateBox label="Legal sidebar slot" adSlot="legal_sidebar" tall occupied={isOccupied("legal_sidebar")} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="cms-ad-template">
                      <h4>FAQ Page</h4>
                      <div className="cms-ad-template-frame">
                        <TemplateBox label="Before FAQ title" adSlot="faq_before_title" occupied={isOccupied("faq_before_title")} />
                        <TemplateBox label="FAQ accordion/content" tall />
                        <TemplateBox label="After FAQ content" adSlot="faq_after_content" occupied={isOccupied("faq_after_content")} />
                      </div>
                    </div>

                    <div className="cms-ad-template">
                      <h4>Guides Index Page</h4>
                      <div className="cms-ad-template-frame">
                        <TemplateBox label="Before guides list title" adSlot="guides_index_before_title" occupied={isOccupied("guides_index_before_title")} />
                        <TemplateBox label="Guides card grid" tall />
                        <TemplateBox label="After guides grid" adSlot="guides_index_after_grid" occupied={isOccupied("guides_index_after_grid")} />
                      </div>
                    </div>

                    <div className="cms-ad-template">
                      <h4>Site Footer</h4>
                      <div className="cms-ad-template-frame">
                        <TemplateBox label="Footer top promo slot" adSlot="footer_promo" occupied={isOccupied("footer_promo")} />
                        <TemplateBox label="Footer links / support columns" />
                      </div>
                    </div>
                  </div>
                </>
              ),
            },
          ]}
        />
      </CmsCard>

      <CmsCard>
        <CmsTable
          columns={[
            { title: "Name", dataIndex: "name", key: "name" },
            {
              title: "Slot",
              dataIndex: "slotId",
              key: "slotId",
              render: (value: string) => presetBySlotId.get(value)?.label || value,
            },
            { title: "Provider", dataIndex: "provider", key: "provider", render: (value) => formatLabel(value) },
            { title: "Environment", dataIndex: "environment", key: "environment", render: (value) => formatLabel(value) },
            { title: "Enabled", dataIndex: "enabled", key: "enabled", render: (value: boolean) => <Switch checked={value} disabled /> },
            {
              title: "Ready",
              key: "ready",
              render: (_, row: RuntimeAdPlacement) => (
                <Tag color={hasRenderablePlacementConfig(row) ? "green" : "default"}>
                  {hasRenderablePlacementConfig(row) ? "Ready" : "Not ready"}
                </Tag>
              ),
            },
            {
              title: "Live",
              key: "live",
              render: (_, row: RuntimeAdPlacement) => (
                <Space orientation="vertical" size={0}>
                  <Tag color={row.lastPublishedAt ? "blue" : "default"}>
                    {row.lastPublishedAt ? "Published" : "Draft only"}
                  </Tag>
                  {row.lastPublishedAt ? (
                    <Text type="secondary">{new Date(row.lastPublishedAt).toLocaleString()}</Text>
                  ) : null}
                </Space>
              ),
            },
            {
              title: "Actions",
              key: "actions",
              render: (_, row: RuntimeAdPlacement) => (
                <Space>
                  <Button
                    onClick={() => {
                      form.setFieldsValue({
                        ...row,
                        categoriesText: row.categories.join(", "),
                        configText: Object.entries(row.config).map(([key, value]) => `${key}=${String(value)}`).join("\n"),
                        config: row.config,
                      });
                      setOpen(true);
                    }}
                    type="link"
                  >
                    Edit
                  </Button>
                  {isSuperadmin ? (
                    <Popconfirm
                      title="Delete this placement?"
                      description="This removes the placement from draft."
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => {
                        void deletePlacement(row);
                      }}
                    >
                      <Button danger type="link">Delete</Button>
                    </Popconfirm>
                  ) : null}
                </Space>
              ),
            },
          ]}
          dataSource={listData.items}
          pagination={{
            current: listData.page,
            pageSize: listData.pageSize,
            total: listData.total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </CmsCard>

      <Modal forceRender onCancel={() => setOpen(false)} onOk={() => form.submit()} open={open} okText="Save draft" title="Placement editor" width={760}>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            const payload: RuntimeAdPlacement = {
              id: values.id || `ad-${Date.now()}`,
              name: values.name,
              provider: values.provider,
              enabled: Boolean(values.enabled),
              slotId: values.slotId,
              scopes: values.scopes,
              categories: splitCategories(values.categoriesText || ""),
              environment: values.environment,
              notes: values.notes || "",
              lastPublishedAt: values.lastPublishedAt || null,
              config: {
                ...Object.fromEntries(
                  splitLines(values.configText || "").map((line) => {
                    const [key, ...rest] = line.split("=");
                    return [key.trim(), rest.join("=").trim()];
                  }).filter(([key]) => key),
                ),
                ...(values.config || {}),
              },
            };

            const next = placements.some((item) => item.id === payload.id)
              ? placements.map((item) => (item.id === payload.id ? payload : item))
              : [...placements, payload];

            void saveDraft.mutateAsync(sanitizeAdsDraft({ ...draft.data, adPlacements: next })).then(async () => {
              await placementsList.refetch();
              setOpen(false);
            });
          }}
        >
          <Form.Item hidden name="id">
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col md={12} span={24}>
              <Form.Item label="Placement name" name="name">
                <Input />
              </Form.Item>
            </Col>
            <Col md={12} span={24}>
              <Form.Item label="Slot" name="slotId">
                <Select
                  options={AD_SLOT_PRESETS.map((preset) => ({
                    label: preset.label,
                    value: preset.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col md={12} span={24}>
              <Form.Item label="Provider" name="provider">
                <Select options={AD_PROVIDER_OPTIONS} />
              </Form.Item>
            </Col>
            <Col md={12} span={24}>
              <Form.Item label="Environment" name="environment">
                <Select options={ENVIRONMENT_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Scopes" name="scopes">
                <Select mode="multiple" options={AD_SCOPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Categories (comma separated)" name="categoriesText">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <div className="cms-form-provider-fields">
                <Text strong style={{ display: "block", marginBottom: 12 }}>Provider-specific Configuration</Text>
                {renderProviderFields()}
              </div>
            </Col>
            <Col span={24}>
              <Form.Item label="Notes" name="notes">
                <Input.TextArea autoSize={{ minRows: 3 }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Enabled" name="enabled" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Space>
  );
}
