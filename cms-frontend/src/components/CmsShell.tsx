"use client";

import {
  ContainerOutlined,
  DashboardOutlined,
  FireOutlined,
  GlobalOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  NotificationOutlined,
  PicRightOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Avatar, Breadcrumb, Button, Drawer, Grid, Layout, Menu, Space, Spin, Typography } from "antd";
import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCmsSession, useLogout } from "@/lib/cms-api";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface NavEntry {
  key: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: NavEntry[];
}

const ADS_GROUP_KEY = "group:ads";

const navigation: NavEntry[] = [
  { key: "/", label: "Dashboard", icon: <DashboardOutlined />, href: "/" },
  { key: "/seo", label: "SEO", icon: <GlobalOutlined />, href: "/seo" },
  {
    key: ADS_GROUP_KEY,
    label: "Ads",
    icon: <NotificationOutlined />,
    href: "/ads",
    children: [
      { key: "/ads/placements", label: "Placements", icon: <PicRightOutlined />, href: "/ads/placements" },
      { key: "/ads/providers", label: "Providers", icon: <SettingOutlined />, href: "/ads/providers" },
      { key: "/ads/ads-txt", label: "Ads.txt", icon: <ContainerOutlined />, href: "/ads/ads-txt" },
    ],
  },
  { key: "/legal-pages", label: "Legal Pages", icon: <SafetyCertificateOutlined />, href: "/legal-pages" },
  { key: "/publish", label: "Publish", icon: <FireOutlined />, href: "/publish" },
  { key: "/admins", label: "Admins", icon: <TeamOutlined />, href: "/admins" },
];

function flattenItems(items: NavEntry[]): NavEntry[] {
  return items.flatMap((item) => [item, ...(item.children ? flattenItems(item.children) : [])]);
}

export default function CmsShell({ children }: PropsWithChildren) {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.lg;
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isPending, isError } = useCmsSession();
  const logout = useLogout();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openMenuKeys, setOpenMenuKeys] = useState<string[]>([]);

  const visibleNavigation = useMemo(
    () => (user?.role === "SUPERADMIN" ? navigation : navigation.filter((entry) => entry.key !== "/admins")),
    [user?.role],
  );

  const breadcrumbItems = useMemo(() => {
    const allItems = flattenItems(visibleNavigation);
    const match = allItems.find((entry) => entry.href && pathname === entry.href);
    if (!match) {
      return [{ title: "CMS" }];
    }
    const parent = visibleNavigation.find((entry) => entry.children?.some((child) => child.href === pathname));
    return [{ title: "CMS" }, ...(parent ? [{ title: parent.label }] : []), { title: match.label }];
  }, [pathname, visibleNavigation]);

  const selectedKeys = useMemo(() => {
    const allItems = flattenItems(visibleNavigation);
    const match = allItems
      .filter((entry) => entry.href && (pathname === entry.href || pathname.startsWith(`${entry.href}/`)))
      .sort((left, right) => (right.href || "").length - (left.href || "").length)[0];
    return [match?.key || "/"];
  }, [pathname, visibleNavigation]);
  const defaultOpenKeys = useMemo(() => (pathname.startsWith("/ads") ? [ADS_GROUP_KEY] : []), [pathname]);
  const routeByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of flattenItems(visibleNavigation)) {
      if (item.href) {
        map.set(item.key, item.href);
      }
    }
    return map;
  }, [visibleNavigation]);

  useEffect(() => {
    setOpenMenuKeys(pathname.startsWith("/ads") ? [ADS_GROUP_KEY] : []);
  }, [pathname]);

  useEffect(() => {
    if (!isPending && (isError || !user)) {
      router.replace("/login");
    }
  }, [isPending, isError, user, router]);

  if (isPending) {
    return (
      <div className="cms-loading-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="cms-loading-screen">
        <Spin size="large" />
      </div>
    );
  }

  const menuNode = (
    <Menu
      items={visibleNavigation.map((entry) => ({
        key: entry.key,
        icon: entry.icon,
        label: entry.label,
        children: entry.children?.map((child) => ({
          key: child.key,
          icon: child.icon,
          label: child.label,
        })),
      }))}
      mode="inline"
      onClick={({ key }) => {
        const target = routeByKey.get(key);
        if (target) {
          router.push(target);
          setDrawerOpen(false);
        }
      }}
      onOpenChange={(nextOpenKeys) => {
        setOpenMenuKeys(nextOpenKeys as string[]);
      }}
      openKeys={collapsed ? [] : openMenuKeys}
      selectedKeys={selectedKeys}
      theme="dark"
      defaultOpenKeys={defaultOpenKeys}
    />
  );

  return (
    <Layout className="cms-layout">
      {!isMobile ? (
        <Sider
          collapsed={collapsed}
          collapsible
          collapsedWidth={88}
          onCollapse={(value) => setCollapsed(value)}
          theme="dark"
          trigger={null}
          width={260}
        >
          <div className="cms-brand">
            <Avatar className="cms-brand-mark" shape="square">
              PT
            </Avatar>
            {!collapsed ? (
              <div>
                <Text className="cms-brand-eyebrow">PDF Toolkit</Text>
                <div className="cms-brand-title">CMS Console</div>
              </div>
            ) : null}
          </div>
          {menuNode}
        </Sider>
      ) : null}
      {isMobile ? (
        <Drawer
          closable
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          placement="left"
          size="default"
          title="CMS Menu"
        >
          {menuNode}
        </Drawer>
      ) : null}
      <Layout>
        <Header className="cms-layout-header">
          <Space align="center" size="middle">
            <Button
              icon={collapsed || isMobile ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => {
                if (isMobile) {
                  setDrawerOpen((current) => !current);
                  return;
                }
                setCollapsed((current) => !current);
              }}
              type="text"
            />
            <Breadcrumb items={breadcrumbItems} />
          </Space>
          <Space align="center">
            <div className="cms-header-user">
              <Text strong>{user.name}</Text>
              <Text type="secondary">{user.email}</Text>
            </div>
            <Button
              onClick={() => {
                void logout.mutateAsync().then(() => router.replace("/login"));
              }}
            >
              Logout
            </Button>
          </Space>
        </Header>
        <Content className="cms-layout-content">{children}</Content>
      </Layout>
    </Layout>
  );
}
