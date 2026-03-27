"use client";

import {
  App as AntdApp,
  Input,
  Space,
} from "antd";
import { useEffect, useState } from "react";
import {
  CmsActionButton,
  CmsCard,
  CmsPageHeader,
} from "../../CmsUi";
import {
  getCmsErrorMessage,
  useAdsDraft,
  useSaveAdsDraft,
} from "@/lib/cms-api";
import {
  joinLines,
  sanitizeAdsDraft,
  splitLines,
} from "@/lib/cms-utils";
import { LoadingPanel, ErrorPanel } from "../shared";

export function AdsTxtPage() {
  const { message } = AntdApp.useApp();
  const [value, setValue] = useState("");
  const draft = useAdsDraft();
  const saveDraft = useSaveAdsDraft({
    onSuccess: () => message.success("ads.txt draft saved."),
    onError: (error) => message.error(getCmsErrorMessage(error, "Could not save the ads.txt draft.")),
  });

  useEffect(() => {
    if (draft.data) {
      setValue(joinLines(draft.data.adsTxtLines));
    }
  }, [draft.data]);

  if (draft.isPending) {
    return <LoadingPanel />;
  }

  if (draft.isError) {
    return <ErrorPanel message="Could not load the ads.txt draft." />;
  }

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <CmsPageHeader
        eyebrow="Ads"
        title="Ads.txt"
        description="Manage publisher declaration lines served from the public frontend at runtime."
        extra={
          <CmsActionButton
            loading={saveDraft.isPending}
            onClick={() => {
              void saveDraft.mutateAsync(sanitizeAdsDraft({ ...draft.data, adsTxtLines: splitLines(value) }));
            }}
          >
            Save draft
          </CmsActionButton>
        }
      />
      <CmsCard>
        <Input.TextArea autoSize={{ minRows: 12 }} onChange={(event) => setValue(event.target.value)} value={value} />
      </CmsCard>
    </Space>
  );
}
