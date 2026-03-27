"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App as AntdApp, theme } from "antd";
import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { createQueryClient } from "@/lib/query-client";

export default function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: "#6366f1",
            colorInfo: "#6366f1",
            colorSuccess: "#10b981",
            colorWarning: "#f59e0b",
            colorError: "#ef4444",
            borderRadius: 10,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            colorBgContainer: "#ffffff",
            colorBgLayout: "#f4f6fa",
            colorBorder: "#e2e8f0",
            colorBorderSecondary: "#f1f5f9",
            fontSize: 14,
            controlHeight: 38,
          },
          components: {
            Layout: {
              headerBg: "#ffffff",
              siderBg: "#0f172a",
              bodyBg: "#f4f6fa",
              triggerBg: "#0f172a",
              headerHeight: 60,
            },
            Menu: {
              darkItemBg: "transparent",
              darkSubMenuItemBg: "transparent",
              darkItemSelectedBg: "rgba(99, 102, 241, 0.22)",
              darkItemHoverBg: "rgba(255, 255, 255, 0.06)",
              darkItemColor: "rgba(255, 255, 255, 0.7)",
              darkItemSelectedColor: "#ffffff",
              itemBorderRadius: 8,
              itemMarginInline: 0,
            },
            Card: {
              borderRadiusLG: 16,
              paddingLG: 20,
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.03)",
            },
            Table: {
              headerBg: "#f8fafd",
              headerColor: "#94a3b8",
              rowHoverBg: "#f0f4ff",
              borderColor: "#e2e8f0",
              cellPaddingBlock: 12,
              cellPaddingInline: 16,
            },
            Input: {
              borderRadius: 10,
              controlHeight: 40,
              activeShadow: "0 0 0 3px rgba(99, 102, 241, 0.08)",
            },
            Select: {
              borderRadius: 10,
              controlHeight: 40,
            },
            Button: {
              borderRadius: 10,
              controlHeight: 40,
              primaryShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
            },
            Modal: {
              borderRadiusLG: 16,
              paddingMD: 24,
            },
            Drawer: {
              borderRadiusLG: 16,
            },
            Tag: {
              borderRadiusSM: 20,
            },
            Breadcrumb: {
              fontSize: 14,
            },
          },
        }}
      >
        <AntdApp>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </AntdApp>
      </ConfigProvider>
    </AntdRegistry>
  );
}
