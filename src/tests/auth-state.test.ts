import { beforeEach, expect, test, vi } from "vitest";
const auth = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn(), mfa: { getAuthenticatorAssuranceLevel: vi.fn() }, signUp: vi.fn(), signInWithPassword: vi.fn() }));
vi.mock("../services/account", () => ({ accountClient: { auth } }));
import { authenticate, refreshAccount, useAccount } from "../services/authState";
beforeEach(() => {
  vi.clearAllMocks();
  useAccount.setState({ ready: false, email: "", factor: "", unavailable: false });
  auth.getSession.mockResolvedValue({ data: { session: { access_token: "test" } } });
  auth.getUser.mockResolvedValue({ data: { user: { id: "1", email: "verified@example.com", factors: [] } } });
  auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: "aal1", nextLevel: "aal1" } });
});
test("cached identity alone cannot open tools when the server rejects it", async () => {
  auth.getUser.mockResolvedValue({ error: new Error("revoked"), data: { user: null } });
  await refreshAccount();
  expect(useAccount.getState()).toMatchObject({ ready: true, email: "", unavailable: true });
});
test("server factors override a stale cached MFA list", async () => {
  auth.getUser.mockResolvedValue({ data: { user: { id: "1", email: "verified@example.com", factors: [{ id: "totp-id", status: "verified", factor_type: "totp" }] } } });
  await refreshAccount();
  expect(useAccount.getState()).toMatchObject({ email: "", factor: "totp-id" });
  auth.mfa.getAuthenticatorAssuranceLevel.mockResolvedValue({ data: { currentLevel: "aal2", nextLevel: "aal2" } });
  await refreshAccount();
  expect(useAccount.getState().email).toBe("verified@example.com");
});
test("an older verification cannot restore a session after a newer sign-out check", async () => {
  let resolve!: (value: unknown) => void;
  auth.getUser.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  const old = refreshAccount();
  await vi.waitFor(() => expect(resolve).toBeTypeOf("function"));
  auth.getSession.mockResolvedValue({ data: { session: null } });
  await refreshAccount();
  resolve({ data: { user: { id: "1", email: "old@example.com" } } });
  await old;
  expect(useAccount.getState().email).toBe("");
});
test("sign-up without a session requires email verification", async () => {
  auth.signUp.mockResolvedValue({ data: { session: null } });
  expect(await authenticate(" new@example.com ", "test-password", true)).toBe("verify");
  expect(auth.signUp).toHaveBeenCalledWith({ email: "new@example.com", password: "test-password" });
  expect(useAccount.getState().email).toBe("");
});
