"use client";

import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Space, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useLogin } from "@/lib/cms-api";

const { Paragraph, Title, Text } = Typography;

export default function LoginForm() {
  const router = useRouter();
  const login = useLogin();

  return (
    <div className="cms-login-screen">
      <Card className="cms-login-card" variant="borderless">
        <Text className="cms-page-eyebrow">PDF Toolkit</Text>
        <Title level={2} style={{ marginTop: 10 }}>
          CMS sign in
        </Title>
        <Paragraph type="secondary">
          Use the seeded superadmin or admin credentials from your root `.env` file to access the CMS.
        </Paragraph>

        <Form
          layout="vertical"
          onFinish={(values) => {
            void login.mutateAsync(values).then(() => {
              router.replace("/");
              router.refresh();
            });
          }}
          size="large"
        >
          <Form.Item label="Email" name="email" rules={[{ required: true, type: "email" }]}>
            <Input prefix={<MailOutlined />} type="email" />
          </Form.Item>
          <Form.Item label="Password" name="password" rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          {login.isError ? <Alert showIcon type="error" title={login.error.message} style={{ marginBottom: 16 }} /> : null}

          <Space orientation="vertical" size={12} style={{ width: "100%" }}>
            <Button block htmlType="submit" loading={login.isPending} type="primary">
              {login.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
}
