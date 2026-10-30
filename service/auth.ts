import { CORE_API_URL, request } from "@/service/core-api"
import type { LoginResponse } from "@/types/auth"

export const AUTH_PATH = "/api/admin/auth"

/**
 * Đăng nhập trang quản trị (POST /api/admin/auth/login).
 * Không gửi kèm access token vì người dùng chưa đăng nhập.
 * Server tạo một phiên mới trong tbl_auth_sessions cho mỗi lần đăng nhập thành công.
 *
 * Dữ liệu vào:
 * - username: tên đăng nhập (server tự cắt khoảng trắng và đổi về chữ thường).
 * - password: mật khẩu, tối đa 72 ký tự.
 *
 * Dữ liệu ra: Promise<LoginResponse> gồm
 * - access_token: token gửi kèm mọi request (header Authorization: Bearer ...).
 * - refresh_token: token dùng để xin cặp token mới khi access_token hết hạn.
 * - token_type: luôn là "Bearer".
 * - expires_in: thời hạn access_token, ví dụ "1d".
 * - account: { username, account_type, is_active, full_name } của tài khoản.
 *
 * Lỗi (CoreApiError):
 * - 400: thiếu tên đăng nhập hoặc mật khẩu.
 * - 401: sai tên đăng nhập hoặc mật khẩu.
 * - 403: tài khoản bị khóa hoặc không phải SYSTEM_ADMIN.
 */
export function login(username: string, password: string) {
  return request<LoginResponse>(
    `${AUTH_PATH}/login`,
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    },
    CORE_API_URL,
    false
  )
}

/**
 * Đăng xuất (POST /api/admin/auth/logout): thu hồi phiên trên server
 * để refresh token này không thể dùng để xin token mới nữa.
 * Không gửi kèm access token; server xác định phiên qua refresh token.
 *
 * Dữ liệu vào:
 * - refreshToken: refresh token hiện tại của phiên (lấy từ auth store).
 *
 * Dữ liệu ra: Promise<void>, server trả 204 No Content.
 * Server luôn trả 204 kể cả khi token đã hết hạn, đã bị thu hồi hoặc không hợp lệ,
 * nên gọi lại nhiều lần vẫn an toàn.
 *
 * Lưu ý: access token đã cấp vẫn dùng được tới khi hết hạn,
 * vì vậy phía client cũng phải xóa phiên trong store (clearSession).
 */
export function logout(refreshToken: string) {
  return request<void>(
    `${AUTH_PATH}/logout`,
    {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
    CORE_API_URL,
    false
  )
}
