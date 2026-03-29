"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, App as AntdApp, theme } from "antd";
import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { useState } from "react";
import { createQueryClient } from "@/lib/query-client";
import { TimezoneProvider } from "@/lib/timezone";

export default function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <AntdRegistry>
      <ConfigProvider
        theme={{
// ... theme data ...
        }}
      >
        <AntdApp>
          <QueryClientProvider client={queryClient}>
            <TimezoneProvider>{children}</TimezoneProvider>
          </QueryClientProvider>
        </AntdApp>
      </ConfigProvider>
    </AntdRegistry>
  );
}
