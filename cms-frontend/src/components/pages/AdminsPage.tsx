"use client";

import { App as AntdApp, Button, Descriptions, Form, Input, Modal, Select, Space, Tag } from "antd";
import { useState } from "react";
import {
  CmsCard,
  CmsPageHeader,
  CmsTable,
} from "../CmsUi";
import {
  getCmsErrorMessage,
  useCmsSession,
  useAdmins,
  usePermissionsCatalog,
  useSaveAdminPermissions,
} from "@/lib/cms-api";
import { LoadingPanel, ErrorPanel } from "./shared";

export function AdminsPage() {
  const { message } = AntdApp.useApp();
  const session = useCmsSession();
  const isSuperadmin = session.data?.role === "SUPERADMIN";
  const currentUserId = session.data?.id || "";
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState("");
  const [form] = Form.useForm<{ permissions: string[] }>();
  const admins = useAdmins({
    q: query.trim() || undefined,
    page,
    pageSize,
  }, isSuperadmin);
  const catalog = usePermissionsCatalog(isSuperadmin);
  const savePermissions = useSaveAdminPermissions({
    onSuccess: () => {
      message.success("Admin permissions updated.");
    },
    onError: (error) => {
      message.error(getCmsErrorMessage(error, "Could not update admin permissions."));
    },
  });

  if (session.isPending) {
    return (
      <>
        <Form component={false} form={form} />
        <LoadingPanel />
      </>
    );
  }

  if (!isSuperadmin) {
    return (
      <>
        <Form component={false} form={form} />
        <ErrorPanel message="Superadmin access required for the admin module." />
      </>
    );
  }

  if (admins.isPending || catalog.isPending) {
    return (
      <>
        <Form component={false} form={form} />
        <LoadingPanel />
      </>
    );
  }

  if (admins.isError || catalog.isError) {
    return (
      <>
        <Form component={false} form={form} />
        <ErrorPanel message="Could not load the admin and permission data." />
      </>
    );
  }

  const permissionOptions = catalog.data.modules.flatMap((module) =>
    catalog.data.actions.map((action) => ({
      label: `${module}:${action}`,
      value: `${module}:${action}`,
    })),
  );

  return (
    <Space orientation="vertical" size={20} style={{ width: "100%" }}>
      <CmsPageHeader
        eyebrow="Operations"
        title="Admins and Permissions"
        description="Superadmin controls admin users, role visibility, and available permission scopes."
        extra={(
          <Input.Search
            allowClear
            enterButton
            size="large"
            placeholder="Search name, email, role"
            value={searchText}
            style={{ minWidth: 320 }}
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
        )}
      />
      <CmsCard title="Admin users">
        <CmsTable
          columns={[
            { title: "Name", dataIndex: "name", key: "name" },
            { title: "Email", dataIndex: "email", key: "email" },
            { title: "Role", dataIndex: "role", key: "role" },
            {
              title: "Permissions",
              key: "permissions",
              render: (_, row) => row.permissions.length
                ? (
                  <Space size={[4, 4]} wrap>
                    {row.permissions.map((permission: string) => (
                      <Tag key={`${row.id}-${permission}`} color="blue">{permission}</Tag>
                    ))}
                  </Space>
                )
                : "Full role access",
            },
            {
              title: "Actions",
              key: "actions",
              render: (_, row) => {
                const lockedByRole = row.role === "SUPERADMIN";
                const lockedBySelf = row.id === currentUserId;
                const isLocked = lockedByRole || lockedBySelf;
                if (isLocked) {
                  return <Tag color="default">{lockedByRole ? "Superadmin locked" : "Current user locked"}</Tag>;
                }

                return (
                  <Button
                    type="link"
                    onClick={() => {
                      setEditingUserId(row.id);
                      setEditingUserName(row.name);
                      form.setFieldsValue({ permissions: row.permissions.filter((permission: string) => permission !== "*") });
                    }}
                  >
                    Edit permissions
                  </Button>
                );
              },
            },
          ]}
          dataSource={admins.data.items}
          pagination={{
            current: admins.data.page,
            pageSize: admins.data.pageSize,
            total: admins.data.total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </CmsCard>
      <CmsCard title="Permission catalog">
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Modules">{catalog.data.modules.join(", ")}</Descriptions.Item>
          <Descriptions.Item label="Actions">{catalog.data.actions.join(", ")}</Descriptions.Item>
        </Descriptions>
      </CmsCard>
      <Modal
        open={Boolean(editingUserId)}
        title={editingUserName ? `Edit permissions: ${editingUserName}` : "Edit permissions"}
        okText="Save permissions"
        forceRender
        onCancel={() => {
          setEditingUserId(null);
          setEditingUserName("");
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={savePermissions.isPending}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (!editingUserId) {
              return;
            }

            void savePermissions.mutateAsync({
              userId: editingUserId,
              permissions: values.permissions || [],
            }).then(() => {
              setEditingUserId(null);
              setEditingUserName("");
              form.resetFields();
            });
          }}
        >
          <Form.Item
            label="Permissions"
            name="permissions"
          >
            <Select
              mode="multiple"
              options={permissionOptions}
              placeholder="Select permissions"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
