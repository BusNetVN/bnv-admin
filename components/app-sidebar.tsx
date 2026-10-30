"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  AppWindowIcon,
  BusIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MapPinIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react"

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
import { logout } from "@/service/auth"
import { useAuthStore } from "@/stores/auth-store"

const navMain = [
  { title: "Tổng quan", url: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Nhà xe", url: "/dashboard/companies", icon: BusIcon },
  { title: "Điểm dừng", url: "/dashboard/points", icon: MapPinIcon },
]

const navSystem = [
  { title: "Người dùng", url: "/dashboard/users", icon: UsersIcon },
  { title: "Chức năng", url: "/dashboard/permissions", icon: AppWindowIcon },
  { title: "Cài đặt", url: "/dashboard/settings", icon: SettingsIcon },
]

/** The account is persisted in browser storage, so the server render never has it. */
function useSignedInAccount() {
  return useSyncExternalStore(
    useAuthStore.subscribe,
    () => useAuthStore.getState().account,
    () => null
  )
}

function isNavActive(pathname: string, url: string) {
  if (url === "/dashboard") {
    return pathname === url
  }

  return pathname === url || pathname.startsWith(`${url}/`)
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const clearSession = useAuthStore((state) => state.clearSession)
  const account = useSignedInAccount()
  const displayName = account?.full_name?.trim() || account?.username || ""

  function handleLogout() {
    const { refreshToken } = useAuthStore.getState()
    clearSession()
    router.replace("/")
    if (refreshToken) {
      // Best effort: the local session is already gone even if the server is unreachable.
      void logout(refreshToken).catch(() => undefined)
    }
  }

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
          {account ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<div />}
                size="lg"
                tooltip={`${displayName} (${account.username})`}
                className="cursor-default hover:bg-transparent hover:text-sidebar-foreground active:bg-transparent active:text-sidebar-foreground"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sm font-medium text-sidebar-accent-foreground uppercase">
                  {displayName.charAt(0)}
                </div>
                <div className="grid min-w-0 flex-1 leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {account.username}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : null}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Đăng xuất">
              <LogOutIcon />
              <span>Đăng xuất</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
