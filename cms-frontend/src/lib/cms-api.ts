"use client";

import axios from "axios";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type {
  AdminUser,
  AdsDraftState,
  AuditLogEntry,
  CmsSystemStatus,
  ContentLibraryState,
  FaqEntry,
  GuideEntry,
  CacheRefreshResult,
  HomepageHeroDraft,
  HomepageDraft,
  ModuleSummaryItem,
  PagedResult,
  PermissionCatalog,
  PublishReadiness,
  ReleaseRecord,
  RuntimeIntegration,
  RuntimeAdPlacement,
  SeoDraft,
  SessionUser,
  LegalPageDocument,
  SiteShellDraft,
  ToolDraftMap,
} from "./cms-types";
import {
  sanitizeAdsDraft,
  sanitizeContentLibrary,
  sanitizeHomepageDraft,
  sanitizeIntegrations,
  sanitizeSeoDraft,
  sanitizeSiteShellDraft,
  sanitizeToolsDraft,
} from "./cms-utils";

const cmsApi = axios.create({
  baseURL: "/api/cms",
  withCredentials: true,
});

type CmsSuccessResponse<T> = {
  success: true;
  data: T;
};

type CmsFailureResponse = {
  success: false;
  message?: string;
};

type CmsResponse<T> = CmsSuccessResponse<T> | CmsFailureResponse;

export const cmsQueryKeys = {
  session: ["cms", "session"] as const,
  systemStatus: ["cms", "system-status"] as const,
  modulesSummary: ["cms", "modules-summary"] as const,
  siteShell: ["cms", "site-shell"] as const,
  homepage: ["cms", "homepage"] as const,
  homepageHero: ["cms", "homepage-hero"] as const,
  tools: ["cms", "tools"] as const,
  seo: ["cms", "seo"] as const,
  integrations: ["cms", "integrations"] as const,
  ads: ["cms", "ads"] as const,
  contentLibrary: ["cms", "content-library"] as const,
  releasesList: (params: Record<string, unknown>) => ["cms", "releases-list", params] as const,
  publishReadiness: ["cms", "publish-readiness"] as const,
  auditLogs: ["cms", "audit-logs"] as const,
  admins: ["cms", "admins"] as const,
  permissions: ["cms", "permissions"] as const,
  adsPlacements: (params: Record<string, unknown>) => ["cms", "ads-placements", params] as const,
  faqList: (params: Record<string, unknown>) => ["cms", "faq-list", params] as const,
  guidesList: (params: Record<string, unknown>) => ["cms", "guides-list", params] as const,
  adminsList: (params: Record<string, unknown>) => ["cms", "admins-list", params] as const,
  auditLogsList: (params: Record<string, unknown>) => ["cms", "audit-logs-list", params] as const,
};

function extractData<T>(response: { data: CmsResponse<T> }, fallbackMessage: string): T {
  if (!response.data.success) {
    throw new Error(response.data.message || fallbackMessage);
  }

  return response.data.data;
}

export function getCmsErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    return message || error.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

async function getSession(): Promise<SessionUser> {
  const response = await cmsApi.get<CmsResponse<{ user: SessionUser }>>("/admin/v1/auth/session");
  return extractData(response, "Could not load the CMS session.").user;
}

async function getSystemStatus(): Promise<CmsSystemStatus> {
  const response = await cmsApi.get<CmsResponse<CmsSystemStatus>>("/admin/v1/system/status");
  return extractData(response, "Could not load the CMS system status.");
}

async function getModulesSummary(): Promise<ModuleSummaryItem[]> {
  const response = await cmsApi.get<CmsResponse<ModuleSummaryItem[]>>("/admin/v1/modules/summary");
  return extractData(response, "Could not load the CMS module summary.");
}

async function getSiteShellDraft(): Promise<SiteShellDraft> {
  const response = await cmsApi.get<CmsResponse<unknown>>("/admin/v1/site-shell/draft");
  return sanitizeSiteShellDraft(extractData(response, "Could not load the site shell draft."));
}

async function saveSiteShellDraft(payload: SiteShellDraft): Promise<SiteShellDraft> {
  const response = await cmsApi.put<CmsResponse<unknown>>("/admin/v1/site-shell/draft", payload);
  return sanitizeSiteShellDraft(extractData(response, "Could not save the site shell draft."));
}

async function getHomepageDraft(): Promise<HomepageDraft> {
  const response = await cmsApi.get<CmsResponse<unknown>>("/admin/v1/homepage/draft");
  return sanitizeHomepageDraft(extractData(response, "Could not load the homepage draft."));
}

async function saveHomepageDraft(payload: HomepageDraft): Promise<HomepageDraft> {
  const response = await cmsApi.put<CmsResponse<unknown>>("/admin/v1/homepage/draft", payload);
  return sanitizeHomepageDraft(extractData(response, "Could not save the homepage draft."));
}

async function getHomepageHeroDraft(): Promise<HomepageHeroDraft> {
  const response = await cmsApi.get<CmsResponse<{ hero?: unknown }>>("/admin/v1/homepage/hero");
  const data = extractData(response, "Could not load the homepage hero draft.");
  const sanitized = sanitizeHomepageDraft({
    home: {
      hero: data.hero || {},
    },
  });
  return { hero: sanitized.home.hero };
}

async function saveHomepageHeroDraft(payload: HomepageHeroDraft): Promise<HomepageHeroDraft> {
  const response = await cmsApi.put<CmsResponse<{ hero?: unknown }>>("/admin/v1/homepage/hero", payload);
  const data = extractData(response, "Could not save the homepage hero draft.");
  const sanitized = sanitizeHomepageDraft({
    home: {
      hero: data.hero || payload.hero,
    },
  });
  return { hero: sanitized.home.hero };
}

async function getToolsDraft(): Promise<ToolDraftMap> {
  const response = await cmsApi.get<CmsResponse<{ tools: unknown }>>("/admin/v1/tools/draft");
  return sanitizeToolsDraft(extractData(response, "Could not load the tool content draft.").tools);
}

async function saveToolsDraft(payload: ToolDraftMap): Promise<ToolDraftMap> {
  const response = await cmsApi.put<CmsResponse<unknown>>("/admin/v1/tools/draft", { tools: payload });
  return sanitizeToolsDraft(extractData(response, "Could not save the tool content draft."));
}

async function getSeoDraft(): Promise<SeoDraft> {
  const response = await cmsApi.get<CmsResponse<unknown>>("/admin/v1/runtime-seo/draft");
  return sanitizeSeoDraft(extractData(response, "Could not load the SEO draft."));
}

async function saveSeoDraft(payload: SeoDraft): Promise<SeoDraft> {
  const response = await cmsApi.put<CmsResponse<unknown>>("/admin/v1/runtime-seo/draft", payload);
  return sanitizeSeoDraft(extractData(response, "Could not save the SEO draft."));
}

async function getIntegrationsDraft(): Promise<RuntimeIntegration[]> {
  const response = await cmsApi.get<CmsResponse<{ integrations: unknown }>>("/admin/v1/integrations/draft");
  return sanitizeIntegrations(extractData(response, "Could not load the integrations draft.").integrations);
}

async function saveIntegrationsDraft(payload: RuntimeIntegration[]): Promise<RuntimeIntegration[]> {
  const response = await cmsApi.put<CmsResponse<unknown>>("/admin/v1/integrations/draft", { integrations: payload });
  const data = extractData(response, "Could not save the integrations draft.") as { integrations?: unknown } | unknown;
  return sanitizeIntegrations((data as { integrations?: unknown }).integrations ?? payload);
}

async function getAdsDraft(): Promise<AdsDraftState> {
  const response = await cmsApi.get<CmsResponse<unknown>>("/admin/v1/ads/draft");
  return sanitizeAdsDraft(extractData(response, "Could not load the ads draft."));
}

async function saveAdsDraft(payload: AdsDraftState): Promise<AdsDraftState> {
  const response = await cmsApi.put<CmsResponse<unknown>>("/admin/v1/ads/draft", payload);
  return sanitizeAdsDraft(extractData(response, "Could not save the ads draft."));
}

async function getContentLibraryDraft(): Promise<ContentLibraryState> {
  const response = await cmsApi.get<CmsResponse<unknown>>("/admin/v1/content-library/draft");
  return sanitizeContentLibrary(extractData(response, "Could not load the content library draft."));
}

async function getLegalPagesDraft(): Promise<Record<string, LegalPageDocument>> {
  const response = await cmsApi.get<CmsResponse<{ legalPages: Record<string, unknown> }>>("/admin/v1/legal-pages/draft");
  const content = extractData(response, "Could not load the legal pages draft.");
  return sanitizeContentLibrary({
    version: 1,
    updatedAt: new Date().toISOString(),
    publishedAt: null,
    legalPages: content.legalPages,
    faq: [],
    guides: [],
  }).legalPages;
}

async function saveLegalPagesDraft(payload: Record<string, LegalPageDocument>): Promise<Record<string, LegalPageDocument>> {
  const response = await cmsApi.put<CmsResponse<{ legalPages: Record<string, unknown> }>>("/admin/v1/legal-pages/draft", { legalPages: payload });
  const content = extractData(response, "Could not save the legal pages draft.");
  return sanitizeContentLibrary({
    version: 1,
    updatedAt: new Date().toISOString(),
    publishedAt: null,
    legalPages: content.legalPages,
    faq: [],
    guides: [],
  }).legalPages;
}

async function getFaqDraftPaged(params: { q?: string; page?: number; pageSize?: number }): Promise<PagedResult<FaqEntry>> {
  const response = await cmsApi.get<CmsResponse<PagedResult<FaqEntry>>>("/admin/v1/faq/draft", { params });
  return extractData(response, "Could not load FAQ entries.");
}

async function saveFaqDraft(payload: FaqEntry[]): Promise<FaqEntry[]> {
  const response = await cmsApi.put<CmsResponse<{ faq: FaqEntry[] }>>("/admin/v1/faq/draft", { faq: payload });
  return extractData(response, "Could not save the FAQ draft.").faq;
}

async function getGuidesDraftPaged(params: { q?: string; page?: number; pageSize?: number }): Promise<PagedResult<GuideEntry>> {
  const response = await cmsApi.get<CmsResponse<PagedResult<GuideEntry>>>("/admin/v1/guides/draft", { params });
  return extractData(response, "Could not load guides.");
}

async function saveGuidesDraft(payload: GuideEntry[]): Promise<GuideEntry[]> {
  const response = await cmsApi.put<CmsResponse<{ guides: GuideEntry[] }>>("/admin/v1/guides/draft", { guides: payload });
  return extractData(response, "Could not save the guides draft.").guides;
}

async function getAdsPlacementsPaged(params: {
  q?: string;
  provider?: string;
  environment?: string;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<RuntimeAdPlacement>> {
  const response = await cmsApi.get<CmsResponse<PagedResult<RuntimeAdPlacement>>>("/admin/v1/ads/placements", { params });
  return extractData(response, "Could not load ad placements.");
}

async function saveContentLibraryDraft(payload: ContentLibraryState): Promise<ContentLibraryState> {
  const response = await cmsApi.put<CmsResponse<unknown>>("/admin/v1/content-library/draft", payload);
  return sanitizeContentLibrary(extractData(response, "Could not save the content library draft."));
}

async function getReleases(params: { q?: string; dateFrom?: string; dateTo?: string }): Promise<ReleaseRecord[]> {
  const response = await cmsApi.get<CmsResponse<ReleaseRecord[]>>("/admin/v1/releases", { params });
  return extractData(response, "Could not load the release history.");
}

async function getPublishReadiness(): Promise<PublishReadiness> {
  const response = await cmsApi.get<CmsResponse<PublishReadiness>>("/admin/v1/publish/readiness");
  return extractData(response, "Could not load publish readiness.");
}

async function getAuditLogs(params: { q?: string; page?: number; pageSize?: number }): Promise<PagedResult<AuditLogEntry>> {
  const response = await cmsApi.get<CmsResponse<PagedResult<AuditLogEntry>>>("/admin/v1/audit-logs", { params });
  return extractData(response, "Could not load the audit logs.");
}

async function getAdmins(params: { q?: string; page?: number; pageSize?: number }): Promise<PagedResult<AdminUser>> {
  const response = await cmsApi.get<CmsResponse<PagedResult<AdminUser>>>("/admin/v1/admins", { params });
  return extractData(response, "Could not load the admin users.");
}

async function getPermissionsCatalog(): Promise<PermissionCatalog> {
  const response = await cmsApi.get<CmsResponse<PermissionCatalog>>("/admin/v1/permissions/catalog");
  return extractData(response, "Could not load the permission catalog.");
}

async function updateAdminPermissions(payload: { userId: string; permissions: string[] }): Promise<AdminUser> {
  const response = await cmsApi.put<CmsResponse<AdminUser>>(`/admin/v1/admins/${payload.userId}/permissions`, {
    permissions: payload.permissions,
  });
  return extractData(response, "Could not update admin permissions.");
}

async function login(payload: { email: string; password: string; twoFactorCode?: string }): Promise<SessionUser> {
  const response = await cmsApi.post<CmsResponse<{ user: SessionUser }>>("/admin/v1/auth/login", payload);
  return extractData(response, "Login failed.").user;
}

async function logout(): Promise<void> {
  await cmsApi.post("/admin/v1/auth/logout");
}

async function publishCms(): Promise<ReleaseRecord> {
  const response = await cmsApi.post<CmsResponse<ReleaseRecord>>("/admin/v1/publish");
  return extractData(response, "Could not publish the CMS content.");
}

async function refreshRuntimeCaches(payload: { clearCmsCache: boolean; revalidateFrontend: boolean }): Promise<CacheRefreshResult> {
  const response = await cmsApi.post<CmsResponse<CacheRefreshResult>>("/admin/v1/cache/refresh", payload);
  return extractData(response, "Could not refresh frontend caches.");
}

function createSaveMutation<TPayload, TResult>(
  mutationFn: (payload: TPayload) => Promise<TResult>,
  invalidateKeys: ReadonlyArray<readonly unknown[]>,
  options?: UseMutationOptions<TResult, Error, TPayload>,
): UseMutationResult<TResult, Error, TPayload> {
  const queryClient = useQueryClient();

  return useMutation<TResult, Error, TPayload>({
    mutationFn,
    ...options,
    onSuccess: async (data, variables, onMutateResult, context) => {
      for (const key of invalidateKeys) {
        await queryClient.invalidateQueries({ queryKey: key });
      }
      await queryClient.invalidateQueries({ queryKey: cmsQueryKeys.publishReadiness });

      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useCmsSession(): UseQueryResult<SessionUser> {
  return useQuery({ queryKey: cmsQueryKeys.session, queryFn: getSession, retry: false });
}

export function useCmsSystemStatus() {
  return useQuery({ queryKey: cmsQueryKeys.systemStatus, queryFn: getSystemStatus });
}

export function useModuleSummary() {
  return useQuery({ queryKey: cmsQueryKeys.modulesSummary, queryFn: getModulesSummary });
}

export function useSiteShellDraft() {
  return useQuery({ queryKey: cmsQueryKeys.siteShell, queryFn: getSiteShellDraft });
}

export function useSaveSiteShellDraft(options?: UseMutationOptions<SiteShellDraft, Error, SiteShellDraft>) {
  return createSaveMutation(saveSiteShellDraft, [cmsQueryKeys.siteShell, cmsQueryKeys.modulesSummary], options);
}

export function useHomepageDraft() {
  return useQuery({ queryKey: cmsQueryKeys.homepage, queryFn: getHomepageDraft });
}

export function useSaveHomepageDraft(options?: UseMutationOptions<HomepageDraft, Error, HomepageDraft>) {
  return createSaveMutation(saveHomepageDraft, [cmsQueryKeys.homepage, cmsQueryKeys.modulesSummary], options);
}

export function useHomepageHeroDraft() {
  return useQuery({ queryKey: cmsQueryKeys.homepageHero, queryFn: getHomepageHeroDraft });
}

export function useSaveHomepageHeroDraft(options?: UseMutationOptions<HomepageHeroDraft, Error, HomepageHeroDraft>) {
  return createSaveMutation(saveHomepageHeroDraft, [cmsQueryKeys.homepageHero, cmsQueryKeys.homepage, cmsQueryKeys.modulesSummary], options);
}

export function useToolsDraft() {
  return useQuery({ queryKey: cmsQueryKeys.tools, queryFn: getToolsDraft });
}

export function useSaveToolsDraft(options?: UseMutationOptions<ToolDraftMap, Error, ToolDraftMap>) {
  return createSaveMutation(saveToolsDraft, [cmsQueryKeys.tools, cmsQueryKeys.modulesSummary], options);
}

export function useSeoDraft() {
  return useQuery({ queryKey: cmsQueryKeys.seo, queryFn: getSeoDraft });
}

export function useSaveSeoDraft(options?: UseMutationOptions<SeoDraft, Error, SeoDraft>) {
  return createSaveMutation(saveSeoDraft, [cmsQueryKeys.seo, cmsQueryKeys.modulesSummary], options);
}

export function useIntegrationsDraft() {
  return useQuery({ queryKey: cmsQueryKeys.integrations, queryFn: getIntegrationsDraft });
}

export function useSaveIntegrationsDraft(options?: UseMutationOptions<RuntimeIntegration[], Error, RuntimeIntegration[]>) {
  return createSaveMutation(saveIntegrationsDraft, [cmsQueryKeys.integrations, cmsQueryKeys.modulesSummary], options);
}

export function useAdsDraft() {
  return useQuery({ queryKey: cmsQueryKeys.ads, queryFn: getAdsDraft });
}

export function useSaveAdsDraft(options?: UseMutationOptions<AdsDraftState, Error, AdsDraftState>) {
  return createSaveMutation(saveAdsDraft, [cmsQueryKeys.ads, cmsQueryKeys.modulesSummary], options);
}

export function useContentLibraryDraft() {
  return useQuery({ queryKey: cmsQueryKeys.contentLibrary, queryFn: getContentLibraryDraft });
}

export function useSaveContentLibraryDraft(options?: UseMutationOptions<ContentLibraryState, Error, ContentLibraryState>) {
  return createSaveMutation(saveContentLibraryDraft, [cmsQueryKeys.contentLibrary, cmsQueryKeys.modulesSummary], options);
}

export function useLegalPagesDraft() {
  return useQuery({ queryKey: ["cms", "legal-pages"] as const, queryFn: getLegalPagesDraft });
}

export function useSaveLegalPagesDraft(
  options?: UseMutationOptions<Record<string, LegalPageDocument>, Error, Record<string, LegalPageDocument>>,
) {
  return createSaveMutation(saveLegalPagesDraft, [["cms", "legal-pages"] as const, cmsQueryKeys.modulesSummary], options);
}

export function useFaqDraftPaged(params: { q?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: cmsQueryKeys.faqList(params),
    queryFn: () => getFaqDraftPaged(params),
  });
}

export function useSaveFaqDraft(options?: UseMutationOptions<FaqEntry[], Error, FaqEntry[]>) {
  return createSaveMutation(
    saveFaqDraft,
    [cmsQueryKeys.contentLibrary, cmsQueryKeys.modulesSummary],
    options,
  );
}

export function useGuidesDraftPaged(params: { q?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: cmsQueryKeys.guidesList(params),
    queryFn: () => getGuidesDraftPaged(params),
  });
}

export function useSaveGuidesDraft(options?: UseMutationOptions<GuideEntry[], Error, GuideEntry[]>) {
  return createSaveMutation(
    saveGuidesDraft,
    [cmsQueryKeys.contentLibrary, cmsQueryKeys.modulesSummary],
    options,
  );
}

export function useAdsPlacementsPaged(params: {
  q?: string;
  provider?: string;
  environment?: string;
  enabled?: boolean;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: cmsQueryKeys.adsPlacements(params),
    queryFn: () => getAdsPlacementsPaged(params),
  });
}

export function useReleaseLog(params: { q?: string; dateFrom?: string; dateTo?: string } = {}) {
  return useQuery({
    queryKey: cmsQueryKeys.releasesList(params),
    queryFn: () => getReleases(params),
  });
}

export function usePublishReadiness() {
  return useQuery({ queryKey: cmsQueryKeys.publishReadiness, queryFn: getPublishReadiness });
}

export function useAuditLogs(params: { q?: string; page?: number; pageSize?: number }) {
  return useQuery({ queryKey: cmsQueryKeys.auditLogsList(params), queryFn: () => getAuditLogs(params) });
}

export function useAdmins(params: { q?: string; page?: number; pageSize?: number }, enabled = true) {
  return useQuery({
    queryKey: cmsQueryKeys.adminsList(params),
    queryFn: () => getAdmins(params),
    enabled,
  });
}

export function usePermissionsCatalog(enabled = true) {
  return useQuery({
    queryKey: cmsQueryKeys.permissions,
    queryFn: getPermissionsCatalog,
    enabled,
  });
}

export function useSaveAdminPermissions(
  options?: UseMutationOptions<AdminUser, Error, { userId: string; permissions: string[] }>,
) {
  return createSaveMutation(
    updateAdminPermissions,
    [["cms", "admins-list"] as const, cmsQueryKeys.permissions],
    options,
  );
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cmsQueryKeys.session });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.removeQueries({ queryKey: cmsQueryKeys.session });
    },
  });
}

export function useRefreshRuntimeCaches() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refreshRuntimeCaches,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.systemStatus }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.publishReadiness }),
      ]);
    },
  });
}

export function usePublishCms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publishCms,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cms", "releases-list"] }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.publishReadiness }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.systemStatus }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.modulesSummary }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.siteShell }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.homepage }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.homepageHero }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.tools }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.seo }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.integrations }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.ads }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.contentLibrary }),
        queryClient.invalidateQueries({ queryKey: cmsQueryKeys.auditLogs }),
        queryClient.invalidateQueries({ queryKey: ["cms", "audit-logs-list"] }),
        queryClient.invalidateQueries({ queryKey: ["cms", "admins-list"] }),
        queryClient.invalidateQueries({ queryKey: ["cms", "faq-list"] }),
        queryClient.invalidateQueries({ queryKey: ["cms", "guides-list"] }),
        queryClient.invalidateQueries({ queryKey: ["cms", "ads-placements"] }),
      ]);
    },
  });
}
