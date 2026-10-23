import type { Session, User } from "@supabase/supabase-js";
import * as ExpoLinking from "expo-linking";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Platform } from "react-native";

import { supabase } from "../lib/supabase";
import { nativeAuthRedirect, nativeCallbackRedirect } from "./authRedirect";

type AuthStatus = "loading" | "signed-in" | "signed-out";
type ProfileRole = "admin" | "tenant" | "unknown";

function nativeExpoCallbackUrl() {
  return nativeCallbackRedirect(process.env.EXPO_PUBLIC_NATIVE_AUTH_REDIRECT_URL);
}

function nativeBridgeRedirectUrl() {
  return nativeAuthRedirect(process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL, ExpoLinking.createURL("auth/callback"));
}

function authRedirectUrl() {
  if (Platform.OS === "web") {
    const configuredUrl = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL;
    if (configuredUrl) return configuredUrl;

    const location = globalThis.location;
    return `${location.origin}${location.pathname}`;
  }

  return nativeBridgeRedirectUrl();
}

function authParamsFromUrl(url: string) {
  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.search);
  if (parsedUrl.hash.startsWith("#")) {
    const hashParams = new URLSearchParams(parsedUrl.hash.slice(1));
    hashParams.forEach((value, key) => params.set(key, value));
  }
  return params;
}

async function setSessionFromUrl(url: string) {
  const params = authParamsFromUrl(url);
  const errorDescription = params.get("error_description") || params.get("error");
  if (errorDescription) return { error: { message: errorDescription } };

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return { error: null };

  return supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
}

function cleanWebAuthUrl() {
  if (Platform.OS !== "web") return;
  const history = globalThis.history;
  const location = globalThis.location;
  if (!history?.replaceState || !location?.href) return;
  const url = new URL(location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  if (url.hash) url.hash = "";
  history.replaceState({}, "", url.toString());
}

export function useAuthSession() {
  const [profileRole, setProfileRole] = useState<ProfileRole>("unknown");
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function hydrateSession() {
      if (Platform.OS === "web" && globalThis.location?.pathname.includes("/auth/native-callback")) {
        const location = globalThis.location;
        globalThis.location.assign(`${nativeExpoCallbackUrl()}${location.hash || location.search || ""}`);
        return;
      }

      if (Platform.OS === "web" && globalThis.location?.href.includes("code=")) {
        const { error } = await supabase.auth.exchangeCodeForSession(globalThis.location.href);
        if (error && mounted) setMessage(error.message);
        cleanWebAuthUrl();
      } else if (Platform.OS === "web" && globalThis.location?.href.includes("access_token=")) {
        const { error } = await setSessionFromUrl(globalThis.location.href);
        if (error && mounted) setMessage(error.message);
        cleanWebAuthUrl();
      }

      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) setMessage(error.message);
      setSession(data.session || null);
      setStatus(data.session ? "signed-in" : "signed-out");
    }

    void hydrateSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? "signed-in" : "signed-out");
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function handleIncomingUrl(event: { url: string }) {
      if (event.url.includes("access_token=")) {
        const { error } = await setSessionFromUrl(event.url);
        if (error) setMessage(error.message);
        return;
      }

      if (event.url.includes("code=")) {
        const { error } = await supabase.auth.exchangeCodeForSession(event.url);
        if (error) setMessage(error.message);
        return;
      }

      if (event.url.includes("error=")) {
        const params = authParamsFromUrl(event.url);
        setMessage(params.get("error_description") || params.get("error") || "Google sign-in failed.");
      }
    }

    const subscription = Linking.addEventListener("url", handleIncomingUrl);
    Linking.getInitialURL().then((url) => {
      if (url) void handleIncomingUrl({ url });
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const userId = session?.user?.id;

    if (!userId) {
      setProfileRole("unknown");
      return;
    }

    supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          setProfileRole("unknown");
          return;
        }
        setProfileRole(data?.role === "admin" ? "admin" : "tenant");
      });

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  const signInWithGoogle = useCallback(async () => {
    setMessage("");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authRedirectUrl(),
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      setMessage(error.message);
      return false;
    }

    if (data.url) {
      if (Platform.OS === "web") {
        globalThis.location.assign(data.url);
        return true;
      }

      await Linking.openURL(data.url);
      setMessage("Google sign-in opened.");
      return true;
    }

    setMessage("Google sign-in could not open.");
    return true;
  }, []);

  const signOut = useCallback(async () => {
    setMessage("");
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage(error.message);
      return false;
    }
    setMessage("Signed out.");
    return true;
  }, []);

  const user: User | null = session?.user || null;

  return useMemo(
    () => ({
      message,
      profileRole,
      session,
      signInWithGoogle,
      signOut,
      status,
      user,
    }),
    [message, profileRole, session, signInWithGoogle, signOut, status, user],
  );
}
