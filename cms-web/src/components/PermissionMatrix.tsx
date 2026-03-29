import { Checkbox, Table, Typography } from "antd";

const { Text } = Typography;

interface PermissionMatrixProps {
  catalog: { modules: string[]; actions: string[] };
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

const FRIENDLY_MODULE_NAMES: Record<string, string> = {
  runtime_config: "Site Configuration",
  content_library: "Content Management",
  audit_logs: "Activity History",
  admins: "Users & Permissions",
  permissions: "Access Control",
};

export function PermissionMatrix({ catalog, value = [], onChange, disabled }: PermissionMatrixProps) {
  const isChecked = (module: string, action: string) => (value || []).includes(`${module}:${action}`);

  const onToggle = (module: string, action: string, checked: boolean) => {
    const key = `${module}:${action}`;
    const next = checked ? [...value, key] : value.filter((v) => v !== key);
    onChange(next);
  };

  const columns = [
    {
      title: "Module",
      dataIndex: "module",
      key: "module",
      render: (m: string) => <Text strong>{FRIENDLY_MODULE_NAMES[m] || m.toUpperCase()}</Text>,
    },
    ...catalog.actions.map((action) => ({
      title: action.toUpperCase(),
      key: action,
      align: "center" as const,
      render: (_: any, record: { module: string }) => (
        <Checkbox
          checked={isChecked(record.module, action)}
          disabled={disabled}
          onChange={(e) => onToggle(record.module, action, e.target.checked)}
        />
      ),
    })),
  ];

  return (
    <Table
      columns={columns}
      dataSource={catalog.modules.map((m) => ({ key: m, module: m }))}
      pagination={false}
      size="small"
      bordered
    />
  );
}
