// @vitest-environment jsdom

import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_EVENT_STORAGE_KEY,
  type AuthSessionReason,
} from "../src/auth/session";

const MOCK_SESSION = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  user: {
    id: "user-123",
    email: "user@hushh.ai",
  },
};

const mockGetSession = vi.fn();
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignOut = vi.fn();
const mockSignInWithOAuth = vi.fn();
const unsubscribeMock = vi.fn();

vi.mock("../src/resources/config/config", () => ({
  default: {
    redirect_url: "http://localhost:5173/auth/callback",
    supabaseClient: {
      auth: {
        getSession: (...args: unknown[]) => mockGetSession(...args),
        getUser: (...args: unknown[]) => mockGetUser(...args),
        onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
        signOut: (...args: unknown[]) => mockSignOut(...args),
        signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      },
    },
  },
}));

import {
  AuthSessionProvider,
  useAuthSession,
} from "../src/auth/AuthSessionProvider";
import HushhTechNavDrawer from "../src/components/hushh-tech-nav-drawer/HushhTechNavDrawer";

function AuthHarness() {
  const {
    status,
    reason,
    user,
    startOAuth,
    handleAccountDeleted,
  } = useAuthSession();

  return React.createElement(
    "div",
    null,
    React.createElement("span", { "data-testid": "status" }, status),
    React.createElement("span", { "data-testid": "reason" }, reason || ""),
    React.createElement("span", { "data-testid": "user-id" }, user?.id || ""),
    React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          void startOAuth("google");
        },
      },
      "Start Google OAuth"
    ),
    React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          void handleAccountDeleted();
        },
      },
      "Handle Account Deleted"
    )
  );
}

function renderWithProvider(node: React.ReactNode) {
  return React.createElement(AuthSessionProvider, null, node);
}

describe("AuthSessionProvider", () => {
  let container: HTMLDivElement;
  let root: Root;

  const flush = async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    mockOnAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: unsubscribeMock } },
    }));
    mockSignOut.mockResolvedValue({ error: null });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("authenticates a valid persisted session", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: MOCK_SESSION },
      error: null,
    });
    mockGetUser.mockResolvedValue({
      data: { user: MOCK_SESSION.user },
      error: null,
    });

    await act(async () => {
      root.render(renderWithProvider(React.createElement(AuthHarness)));
    });
    await flush();

    expect(container.querySelector('[data-testid="status"]')?.textContent).toBe(
      "authenticated"
    );
    expect(container.querySelector('[data-testid="user-id"]')?.textContent).toBe(
      "user-123"
    );
  });

  it("invalidates a stale persisted session and clears it locally", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: MOCK_SESSION },
      error: null,
    });
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { status: 401, message: "JWT expired" },
    });

    await act(async () => {
      root.render(renderWithProvider(React.createElement(AuthHarness)));
    });
    await flush();

    expect(container.querySelector('[data-testid="status"]')?.textContent).toBe(
      "invalidated"
    );
    expect(container.querySelector('[data-testid="reason"]')?.textContent).toBe(
      "expired"
    );
    expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("broadcast-driven deletion invalidates another tab immediately", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: MOCK_SESSION },
      error: null,
    });
    mockGetUser.mockResolvedValue({
      data: { user: MOCK_SESSION.user },
      error: null,
    });

    await act(async () => {
      root.render(renderWithProvider(React.createElement(AuthHarness)));
    });
    await flush();

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: AUTH_EVENT_STORAGE_KEY,
          newValue: JSON.stringify({
            at: Date.now(),
            reason: "deleted" satisfies AuthSessionReason,
          }),
        })
      );
    });
    await flush();

    expect(container.querySelector('[data-testid="status"]')?.textContent).toBe(
      "invalidated"
    );
    expect(container.querySelector('[data-testid="reason"]')?.textContent).toBe(
      "deleted"
    );
    expect(mockSignOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("starts unified Google OAuth from the provider action", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    mockSignInWithOAuth.mockResolvedValue({
      data: { url: null },
      error: null,
    });

    await act(async () => {
      root.render(renderWithProvider(React.createElement(AuthHarness)));
    });
    await flush();

    await act(async () => {
      container
        .querySelector("button")
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "google",
        options: expect.objectContaining({
          redirectTo: expect.stringContaining("/auth/callback"),
        }),
      })
    );
  });
});

describe("HushhTechNavDrawer auth gating", () => {
  let container: HTMLDivElement;
  let root: Root;

  const flush = async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mockOnAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: unsubscribeMock } },
    }));
    mockSignOut.mockResolvedValue({ error: null });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("shows guest actions and hides account actions when no session exists", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await act(async () => {
      root.render(
        renderWithProvider(
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(HushhTechNavDrawer, {
              isOpen: true,
              onClose: vi.fn(),
            })
          )
        )
      );
    });
    await flush();

    expect(container.textContent).toContain("Log In");
    expect(container.textContent).toContain("Sign Up");
    expect(container.textContent).not.toContain("Log Out");
    expect(container.textContent).not.toContain("Delete Account");
    expect(container.textContent).not.toContain("View Profile");
  });

  it("shows account actions for authenticated users and logout performs a real sign-out", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: MOCK_SESSION },
      error: null,
    });
    mockGetUser.mockResolvedValue({
      data: { user: MOCK_SESSION.user },
      error: null,
    });

    await act(async () => {
      root.render(
        renderWithProvider(
          React.createElement(
            MemoryRouter,
            null,
            React.createElement(HushhTechNavDrawer, {
              isOpen: true,
              onClose: vi.fn(),
            })
          )
        )
      );
    });
    await flush();

    expect(container.textContent).toContain("Log Out");
    expect(container.textContent).toContain("Delete Account");
    expect(container.textContent).toContain("View Profile");

    const logoutButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Log Out")
    );

    await act(async () => {
      logoutButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    expect(mockSignOut).toHaveBeenCalled();
  });
});
