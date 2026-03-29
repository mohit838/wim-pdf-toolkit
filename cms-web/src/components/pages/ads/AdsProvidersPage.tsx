"use client";

import {
  App as AntdApp,
  Collapse,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Switch,
} from "antd";
import { useEffect } from "react";
import {
  CmsActionButton,
  CmsCard,
  CmsPageHeader,
} from "../../CmsUi";
import {
  ENVIRONMENT_OPTIONS,
  INTEGRATION_SCOPE_OPTIONS,
} from "@/lib/cms-constants";
import {
  getCmsErrorMessage,
  useAdsDraft,
  useSaveAdsDraft,
  useIntegrationsDraft,
  useSaveIntegrationsDraft,
} from "@/lib/cms-api";
import type { IntegrationKind, RuntimeIntegration } from "@/lib/cms-types";
import {
  createEmptyIntegration,
  sanitizeIntegrations,
} from "@/lib/cms-utils";
import { LoadingPanel, ErrorPanel } from "../shared";

function toIntegrationConfig(values: Record<string, unknown>, keys: string[]): Record<string, string | boolean> {
  const entries: Array<[string, string | boolean]> = [];

  for (const key of keys) {
    const raw = values[key];
    if (typeof raw === "boolean") {
      entries.push([key, raw]);
      continue;
    }

    const value = String(raw || "").trim();
    if (value) {
      entries.push([key, value]);
    }
  }

  return Object.fromEntries(entries);
}

function ensureIntegration(
  allIntegrations: RuntimeIntegration[] | undefined,
  kind: IntegrationKind,
): RuntimeIntegration {
  return allIntegrations?.find((entry) => entry.kind === kind) || {
    ...createEmptyIntegration(),
    kind,
    config: {},
  };
}

export function AdsProvidersPage() {
  const { message } = AntdApp.useApp();
  const [adsenseForm] = Form.useForm();
  const [gtmForm] = Form.useForm();
  const [adManagerForm] = Form.useForm();
  const [ezoicForm] = Form.useForm();
  const [mediavineForm] = Form.useForm();
  const [adThriveForm] = Form.useForm();
  const [thirdPartyForm] = Form.useForm();
  const [blueprintForm] = Form.useForm();
  const hiddenForms = (
    <>
      <Form component={false} form={adsenseForm} />
      <Form component={false} form={gtmForm} />
      <Form component={false} form={adManagerForm} />
      <Form component={false} form={ezoicForm} />
      <Form component={false} form={mediavineForm} />
      <Form component={false} form={adThriveForm} />
      <Form component={false} form={thirdPartyForm} />
      <Form component={false} form={blueprintForm} />
    </>
  );

  const integrations = useIntegrationsDraft();
  const adsDraft = useAdsDraft();

  const saveIntegrations = useSaveIntegrationsDraft({
    onSuccess: () => message.success("Provider settings saved."),
    onError: (error) => message.error(getCmsErrorMessage(error, "Could not save provider settings.")),
  });

  const saveAdsDraft = useSaveAdsDraft({
    onSuccess: () => message.success("Blueprint mode saved."),
    onError: (error) => message.error(getCmsErrorMessage(error, "Could not save blueprint mode.")),
  });

  const allIntegrations = integrations.data || [];
  const adsense = ensureIntegration(allIntegrations, "adsense");
  const gtm = ensureIntegration(allIntegrations, "google_tag_manager");
  const adManager = ensureIntegration(allIntegrations, "google_ad_manager");
  const ezoic = ensureIntegration(allIntegrations, "ezoic");
  const mediavine = ensureIntegration(allIntegrations, "mediavine");
  const adThrive = ensureIntegration(allIntegrations, "adthrive");
  const thirdParty = ensureIntegration(allIntegrations, "custom_third_party_script");

  useEffect(() => {
    adsenseForm.setFieldsValue({
      ...adsense,
      publisherId: String(adsense.config.publisherId || ""),
    });
    gtmForm.setFieldsValue({
      ...gtm,
      containerId: String(gtm.config.containerId || ""),
      dataLayerName: String(gtm.config.dataLayerName || "dataLayer"),
    });
    adManagerForm.setFieldsValue({
      ...adManager,
      networkCode: String(adManager.config.networkCode || ""),
      enableSingleRequest: Boolean(adManager.config.enableSingleRequest ?? true),
      collapseEmptyDivs: Boolean(adManager.config.collapseEmptyDivs ?? true),
    });
    ezoicForm.setFieldsValue({
      ...ezoic,
      placeholderId: String(ezoic.config.placeholderId || ""),
    });
    mediavineForm.setFieldsValue({
      ...mediavine,
      siteId: String(mediavine.config.siteId || ""),
    });
    adThriveForm.setFieldsValue({
      ...adThrive,
      siteId: String(adThrive.config.siteId || ""),
    });
    thirdPartyForm.setFieldsValue({
      ...thirdParty,
      scriptId: String(thirdParty.config.scriptId || "third-party-script"),
      scriptSrc: String(thirdParty.config.scriptSrc || ""),
      inlineScript: String(thirdParty.config.inlineScript || ""),
      async: Boolean(thirdParty.config.async ?? true),
      defer: Boolean(thirdParty.config.defer ?? false),
    });
  }, [adsense, gtm, adManager, ezoic, mediavine, adThrive, thirdParty, adsenseForm, gtmForm, adManagerForm, ezoicForm, mediavineForm, adThriveForm, thirdPartyForm]);

  useEffect(() => {
    if (adsDraft.data) {
      blueprintForm.setFieldsValue({ blueprintEnabled: adsDraft.data.blueprintEnabled });
    }
  }, [adsDraft.data, blueprintForm]);

  if (integrations.isPending || adsDraft.isPending) {
    return (
      <>
        {hiddenForms}
        <LoadingPanel />
      </>
    );
  }

  if (integrations.isError || adsDraft.isError) {
    return (
      <>
        {hiddenForms}
        <ErrorPanel message="Could not load provider settings." />
      </>
    );
  }

  const saveOne = async (
    kind: IntegrationKind,
    values: Record<string, unknown>,
    configKeys: string[],
  ) => {
    const current = allIntegrations;
    const existing = ensureIntegration(current, kind);
    const nextEntry: RuntimeIntegration = {
      id: String(values.id || existing.id),
      kind,
      enabled: Boolean(values.enabled),
      scope: values.scope as RuntimeIntegration["scope"],
      environment: values.environment as RuntimeIntegration["environment"],
      notes: String(values.notes || ""),
      lastPublishedAt: existing.lastPublishedAt || null,
      config: toIntegrationConfig(values, configKeys),
    };

    const next = current.some((entry) => entry.kind === kind)
      ? current.map((entry) => (entry.kind === kind ? nextEntry : entry))
      : [...current, nextEntry];

    await saveIntegrations.mutateAsync(sanitizeIntegrations(next));
  };

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      {hiddenForms}
      <CmsPageHeader
        eyebrow="Ads"
        title="Providers"
        description="Simple provider forms for non-technical admins. Save draft, then publish to apply on frontend."
      />

      <CmsCard>
        <Collapse
          defaultActiveKey={["adsense"]}
          items={[
            {
              key: "adsense",
              label: "Google AdSense",
              children: (
                <Form
                  form={adsenseForm}
                  layout="vertical"
                  onFinish={(values) => {
                    void saveOne("adsense", values, ["publisherId"]);
                  }}
                >
                  <Row gutter={16}>
                    <Col md={12} span={24}><Form.Item label="Enabled" name="enabled" valuePropName="checked"><Switch /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Publisher ID (ca-pub-...)" name="publisherId"><Input /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Scope" name="scope"><Select options={INTEGRATION_SCOPE_OPTIONS} /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Environment" name="environment"><Select options={ENVIRONMENT_OPTIONS} /></Form.Item></Col>
                    <Col span={24}><Form.Item label="Notes" name="notes"><Input.TextArea autoSize={{ minRows: 2 }} /></Form.Item></Col>
                  </Row>
                  <CmsActionButton htmlType="submit" loading={saveIntegrations.isPending}>Save AdSense</CmsActionButton>
                </Form>
              ),
            },
            {
              key: "gtm",
              label: "Google Tag Manager",
              children: (
                <Form
                  form={gtmForm}
                  layout="vertical"
                  onFinish={(values) => {
                    void saveOne("google_tag_manager", values, ["containerId", "dataLayerName"]);
                  }}
                >
                  <Row gutter={16}>
                    <Col md={12} span={24}><Form.Item label="Enabled" name="enabled" valuePropName="checked"><Switch /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Container ID (GTM-XXXX)" name="containerId"><Input /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Data layer name" name="dataLayerName"><Input placeholder="dataLayer" /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Scope" name="scope"><Select options={INTEGRATION_SCOPE_OPTIONS} /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Environment" name="environment"><Select options={ENVIRONMENT_OPTIONS} /></Form.Item></Col>
                    <Col span={24}><Form.Item label="Notes" name="notes"><Input.TextArea autoSize={{ minRows: 2 }} /></Form.Item></Col>
                  </Row>
                  <CmsActionButton htmlType="submit" loading={saveIntegrations.isPending}>Save GTM</CmsActionButton>
                </Form>
              ),
            },
            {
              key: "ad-manager",
              label: "Google Ad Manager",
              children: (
                <Form
                  form={adManagerForm}
                  layout="vertical"
                  onFinish={(values) => {
                    void saveOne("google_ad_manager", values, ["networkCode", "enableSingleRequest", "collapseEmptyDivs"]);
                  }}
                >
                  <Row gutter={16}>
                    <Col md={12} span={24}><Form.Item label="Enabled" name="enabled" valuePropName="checked"><Switch /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Network code (e.g. /1234567)" name="networkCode"><Input /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Single request mode" name="enableSingleRequest" valuePropName="checked"><Switch /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Collapse empty divs" name="collapseEmptyDivs" valuePropName="checked"><Switch /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Scope" name="scope"><Select options={INTEGRATION_SCOPE_OPTIONS} /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Environment" name="environment"><Select options={ENVIRONMENT_OPTIONS} /></Form.Item></Col>
                    <Col span={24}><Form.Item label="Notes" name="notes"><Input.TextArea autoSize={{ minRows: 2 }} /></Form.Item></Col>
                  </Row>
                  <CmsActionButton htmlType="submit" loading={saveIntegrations.isPending}>Save Ad Manager</CmsActionButton>
                </Form>
              ),
            },
            {
              key: "ezoic",
              label: "Ezoic",
              children: (
                <Form
                  form={ezoicForm}
                  layout="vertical"
                  onFinish={(values) => {
                    void saveOne("ezoic", values, ["placeholderId"]);
                  }}
                >
                  <Row gutter={16}>
                    <Col md={12} span={24}><Form.Item label="Enabled" name="enabled" valuePropName="checked"><Switch /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Placeholder ID" name="placeholderId" extra="Find this in Ezoic Ads -> Integration."><Input /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Scope" name="scope"><Select options={INTEGRATION_SCOPE_OPTIONS} /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Environment" name="environment"><Select options={ENVIRONMENT_OPTIONS} /></Form.Item></Col>
                  </Row>
                  <CmsActionButton htmlType="submit" loading={saveIntegrations.isPending}>Save Ezoic</CmsActionButton>
                </Form>
              ),
            },
            {
              key: "mediavine",
              label: "Mediavine",
              children: (
                <Form
                  form={mediavineForm}
                  layout="vertical"
                  onFinish={(values) => {
                    void saveOne("mediavine", values, ["siteId"]);
                  }}
                >
                  <Row gutter={16}>
                    <Col md={12} span={24}><Form.Item label="Enabled" name="enabled" valuePropName="checked"><Switch /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Site ID (UUID)" name="siteId" extra="Find this in Mediavine Control Panel."><Input /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Scope" name="scope"><Select options={INTEGRATION_SCOPE_OPTIONS} /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Environment" name="environment"><Select options={ENVIRONMENT_OPTIONS} /></Form.Item></Col>
                  </Row>
                  <CmsActionButton htmlType="submit" loading={saveIntegrations.isPending}>Save Mediavine</CmsActionButton>
                </Form>
              ),
            },
            {
              key: "adthrive",
              label: "AdThrive / Raptive",
              children: (
                <Form
                  form={adThriveForm}
                  layout="vertical"
                  onFinish={(values) => {
                    void saveOne("adthrive", values, ["siteId"]);
                  }}
                >
                  <Row gutter={16}>
                    <Col md={12} span={24}><Form.Item label="Enabled" name="enabled" valuePropName="checked"><Switch /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Site ID" name="siteId" extra="Find this in AdThrive/Raptive Dashboard."><Input /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Scope" name="scope"><Select options={INTEGRATION_SCOPE_OPTIONS} /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Environment" name="environment"><Select options={ENVIRONMENT_OPTIONS} /></Form.Item></Col>
                  </Row>
                  <CmsActionButton htmlType="submit" loading={saveIntegrations.isPending}>Save AdThrive</CmsActionButton>
                </Form>
              ),
            },
            {
              key: "third-party",
              label: "Custom Third-Party Script",
              children: (
                <Form
                  form={thirdPartyForm}
                  layout="vertical"
                  onFinish={(values) => {
                    void saveOne("custom_third_party_script", values, ["scriptId", "scriptSrc", "inlineScript", "async", "defer"]);
                  }}
                >
                  <Row gutter={16}>
                    <Col md={12} span={24}><Form.Item label="Enabled" name="enabled" valuePropName="checked"><Switch /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Script ID" name="scriptId"><Input placeholder="partner-script" /></Form.Item></Col>
                    <Col span={24}><Form.Item label="Script source URL" name="scriptSrc"><Input placeholder="https://example.com/script.js" /></Form.Item></Col>
                    <Col span={24}><Form.Item label="Inline script (optional)" name="inlineScript"><Input.TextArea autoSize={{ minRows: 4 }} /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Async" name="async" valuePropName="checked"><Switch /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Defer" name="defer" valuePropName="checked"><Switch /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Scope" name="scope"><Select options={INTEGRATION_SCOPE_OPTIONS} /></Form.Item></Col>
                    <Col md={12} span={24}><Form.Item label="Environment" name="environment"><Select options={ENVIRONMENT_OPTIONS} /></Form.Item></Col>
                    <Col span={24}><Form.Item label="Notes" name="notes"><Input.TextArea autoSize={{ minRows: 2 }} /></Form.Item></Col>
                  </Row>
                  <CmsActionButton htmlType="submit" loading={saveIntegrations.isPending}>Save third-party script</CmsActionButton>
                </Form>
              ),
            },
            {
              key: "blueprint",
              label: "Ad Blueprint Mode",
              children: (
                <Form
                  form={blueprintForm}
                  layout="vertical"
                  onFinish={(values) => {
                    void saveAdsDraft.mutateAsync({
                      ...adsDraft.data!,
                      blueprintEnabled: Boolean(values.blueprintEnabled),
                    });
                  }}
                >
                  <Form.Item
                    label="Blueprint Mode (Show ad size boxes)"
                    name="blueprintEnabled"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  <CmsActionButton htmlType="submit" loading={saveAdsDraft.isPending}>Save blueprint mode</CmsActionButton>
                </Form>
              ),
            },
          ]}
        />
      </CmsCard>
    </Space>
  );
}
