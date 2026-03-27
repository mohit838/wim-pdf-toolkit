"use client";

import {
  Badge,
  Button,
  Card,
  Drawer,
  Empty,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  type ButtonProps,
  type CardProps,
  type DrawerProps,
  type InputProps,
  type ModalProps,
  type TableProps,
} from "antd";
import type { PropsWithChildren, ReactNode } from "react";
import type { CmsModuleStatus } from "@/lib/cms-types";

const { Text, Title } = Typography;

export function CmsPageHeader({
  eyebrow,
  title,
  description,
  extra,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="cms-page-header">
      <div>
        {eyebrow ? <span className="cms-page-eyebrow">{eyebrow}</span> : null}
        <Title level={2} style={{ margin: "10px 0 0" }}>
          {title}
        </Title>
        {description ? <Text className="cms-page-description">{description}</Text> : null}
      </div>
      {extra ? <Space wrap>{extra}</Space> : null}
    </div>
  );
}

export function CmsCard({ children, ...props }: PropsWithChildren<CardProps>) {
  return (
    <Card variant="borderless" className="cms-card" {...props}>
      {children}
    </Card>
  );
}

export function CmsStatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
}) {
  return (
    <Card variant="borderless" className="cms-card cms-stat-card">
      <Text className="cms-stat-label">{label}</Text>
      <Title level={3} className="cms-stat-value">
        {value}
      </Title>
      {note ? <Text className="cms-stat-note">{note}</Text> : null}
    </Card>
  );
}

export function CmsTable<RecordType extends object>(props: TableProps<RecordType>) {
  const resolvedRowKey = props.rowKey ?? ((record: RecordType) => {
    if ("id" in record && record.id != null) return String(record.id);
    if ("key" in record && record.key != null) return String(record.key);
    if ("slug" in record && record.slug != null) return String(record.slug);
    return JSON.stringify(record);
  });

  return (
    <Table<RecordType>
      className="cms-table"
      pagination={{ pageSize: 10, showSizeChanger: true, ...props.pagination }}
      rowKey={resolvedRowKey as TableProps<RecordType>['rowKey']}
      {...props}
    />
  );
}

export function CmsSearchInput(props: InputProps) {
  return (
    <span className="cms-search-input">
      <Input.Search allowClear size="large" {...props} />
    </span>
  );
}

export function CmsStatusBadge({
  status,
  children,
}: PropsWithChildren<{ status: CmsModuleStatus | "success" | "neutral" | "error" }>) {
  const color = status === "live" || status === "success"
    ? "green"
    : status === "seeded" || status === "neutral"
      ? "blue"
      : status === "planned"
        ? "gold"
        : "red";

  return <Tag className="cms-status-badge" color={color}>{children}</Tag>;
}

export function CmsDrawerForm({ children, ...props }: PropsWithChildren<DrawerProps>) {
  return (
    <Drawer destroyOnHidden maskClosable width={560} {...props}>
      {children}
    </Drawer>
  );
}

export function CmsConfirmModal(props: ModalProps) {
  return <Modal okText="Confirm" cancelText="Cancel" {...props} />;
}

export function CmsEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="cms-empty-state">
      <Empty description={false} />
      <Title level={4} style={{ marginBottom: 8 }}>
        {title}
      </Title>
      {description ? <Text className="cms-empty-description">{description}</Text> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function CmsActionButton(props: ButtonProps) {
  return <Button size="large" type="primary" {...props} />;
}
