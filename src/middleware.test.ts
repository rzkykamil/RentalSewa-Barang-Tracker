import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * Unit tests for the role-guard middleware (see docs/flows/auth-permission-flow.md §2).
 * `getToken` is mocked since it depends on real JWT cookies we don't have
 * here — this isolates the routing/redirect logic under test.
 */

const mockGetToken = vi.fn();
vi.mock("next-auth/jwt", () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
}));

const { middleware } = await import("@/middleware");

function buildRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`);
}

describe("role-guard middleware", () => {
  it("meloloskan request ke path di luar /owner, /renter, /admin tanpa cek token", async () => {
    mockGetToken.mockResolvedValue(null);
    const response = await middleware(buildRequest("/browse"));
    expect(response.status).toBe(200);
  });

  it("redirect ke /login saat mengakses /owner/dashboard tanpa token", async () => {
    mockGetToken.mockResolvedValue(null);
    const response = await middleware(buildRequest("/owner/dashboard"));
    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("/login");
    expect(location).toContain("callbackUrl=%2Fowner%2Fdashboard");
  });

  it("mengizinkan akses /owner/dashboard saat role token = OWNER", async () => {
    mockGetToken.mockResolvedValue({ role: "OWNER" });
    const response = await middleware(buildRequest("/owner/dashboard"));
    expect(response.status).toBe(200);
  });

  it("redirect ke / saat role token RENTER mencoba akses /owner/dashboard", async () => {
    mockGetToken.mockResolvedValue({ role: "RENTER" });
    const response = await middleware(buildRequest("/owner/dashboard"));
    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/");
  });

  it("mengizinkan akses /renter/dashboard saat role token = RENTER", async () => {
    mockGetToken.mockResolvedValue({ role: "RENTER" });
    const response = await middleware(buildRequest("/renter/dashboard"));
    expect(response.status).toBe(200);
  });

  it("redirect ke / saat role token OWNER mencoba akses /admin", async () => {
    mockGetToken.mockResolvedValue({ role: "OWNER" });
    const response = await middleware(buildRequest("/admin/dashboard"));
    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBe("http://localhost:3000/");
  });

  it("mengizinkan akses /admin/dashboard saat role token = ADMIN", async () => {
    mockGetToken.mockResolvedValue({ role: "ADMIN" });
    const response = await middleware(buildRequest("/admin/dashboard"));
    expect(response.status).toBe(200);
  });
});
