"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  AppWindowIcon,
  BusIcon,
  CalendarClockIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MapIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TicketIcon,
  UserCogIcon,
  UsersIcon,
} from "lucide-react"

import { logoutAction } from "@/actions/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navMain = [
  { title: "Tổng quan", url: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Nhà xe", url: "/dashboard/operators", icon: BusIcon },
  { title: "Tuyến xe", url: "/dashboard/routes", icon: MapIcon },
  { title: "Chuyến xe", url: "/dashboard/trips", icon: CalendarClockIcon },
  { title: "Vé", url: "/dashboard/tickets", icon: TicketIcon },
]

const navSystem = [
  { title: "Tài khoản", url: "/dashboard/accounts", icon: UserCogIcon },
  { title: "Chức năng", url: "/dashboard/permissions", icon: AppWindowIcon },
  { title: "Người dùng", url: "/dashboard/users", icon: UsersIcon },
  { title: "Cài đặt", url: "/dashboard/settings", icon: SettingsIcon },
]

function isNavActive(pathname: string, url: string) {
  if (url === "/dashboard") {
    return pathname === url
  }

  return pathname === url || pathname.startsWith(`${url}/`)
}

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/dashboard" />}
              size="lg"
              tooltip="BusNetVN Admin"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <ShieldCheckIcon className="size-4" />
              </div>
              <span className="font-heading font-medium">BusNetVN Admin</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    isActive={isNavActive(pathname, item.url)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Hệ thống</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navSystem.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    isActive={isNavActive(pathname, item.url)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={logoutAction}>
              <SidebarMenuButton type="submit" tooltip="Đăng xuất">
                <LogOutIcon />
                <span>Đăng xuất</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
