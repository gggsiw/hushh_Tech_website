/**
 * Login Page — All Business Logic
 *
 * Contains:
 * - Auth session check & redirect
 * - OAuth sign-in handlers (Apple, Google)
 * - Loading state management
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DEFAULT_AUTH_REDIRECT, sanitizeInternalRedirect } from "../../utils/security";
import { useAuthSession } from "../../auth/AuthSessionProvider";

/* ─── Types ─── */
export interface LoginLogic {
  isLoading: boolean;
  isSigningIn: boolean;
  handleAppleSignIn: () => Promise<void>;
  handleGoogleSignIn: () => Promise<void>;
}

/* ─── Main Hook ─── */
export const useLoginLogic = (): LoginLogic => {
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { status, startOAuth } = useAuthSession();

  // Stable redirect path — computed once from URL params
  const redirectPath = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return sanitizeInternalRedirect(params.get("redirect"), DEFAULT_AUTH_REDIRECT);
  }, []);

  /* Auth session listener — redirect if already logged in */
  useEffect(() => {
    if (status === "authenticated") {
      navigate(redirectPath, { replace: true });
    }
  }, [navigate, redirectPath, status]);

  /* Apple OAuth — prevent double-clicks */
  const handleAppleSignIn = useCallback(async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    const initiated = await startOAuth("apple");
    if (!initiated) {
      setIsSigningIn(false);
    }
  }, [isSigningIn, startOAuth]);

  /* Google OAuth — prevent double-clicks */
  const handleGoogleSignIn = useCallback(async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    const initiated = await startOAuth("google");
    if (!initiated) {
      setIsSigningIn(false);
    }
  }, [isSigningIn, startOAuth]);

  return {
    isLoading: status === "booting",
    isSigningIn,
    handleAppleSignIn,
    handleGoogleSignIn,
  };
};
