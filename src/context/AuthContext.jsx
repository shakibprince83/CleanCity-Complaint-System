// Authentication state and citizen profile operations shared across the app.
import React from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const AuthContext = React.createContext(null);

const missingConfigurationMessage =
  "Supabase is not configured. Add the project URL and publishable key to .env.local.";

const createNidFingerprint = async (nid) => {
  const normalizedNid = nid.replace(/\D/g, "");
  const bytes = new TextEncoder().encode(`cleancity-nid:${normalizedNid}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export function AuthProvider({ children }) {
  const [session, setSession] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [profileLoading, setProfileLoading] = React.useState(false);

  const loadProfile = React.useCallback(async (userId) => {
    if (!supabase || !userId) {
      setProfile(null);
      return null;
    }

    setProfileLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfileLoading(false);

    if (error) throw error;
    setProfile(data);
    return data;
  }, []);

  React.useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error("Unable to restore Supabase session", error);
      setSession(data?.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        if (!nextSession) setProfile(null);
        setLoading(false);
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    if (!session?.user?.id) return;
    loadProfile(session.user.id).catch((error) => {
      console.error("Unable to load citizen profile", error);
      setProfile(null);
    });
  }, [loadProfile, session?.user?.id]);

  const checkNidAvailability = React.useCallback(async (nid) => {
    if (!supabase) throw new Error(missingConfigurationMessage);
    const normalizedNid = nid.replace(/\D/g, "");
    if (![10, 13].includes(normalizedNid.length)) {
      throw new Error("NID must contain exactly 10 or 13 digits.");
    }
    const fingerprint = await createNidFingerprint(normalizedNid);
    const { data, error } = await supabase.rpc("nid_is_available", {
      candidate_fingerprint: fingerprint,
    });
    if (error) throw error;
    return { available: Boolean(data), fingerprint, normalizedNid };
  }, []);

  const signUp = React.useCallback(async (values) => {
    if (!supabase) throw new Error(missingConfigurationMessage);

    const nidCheck = await checkNidAvailability(values.nid);
    if (!nidCheck.available) {
      throw new Error("An account already exists with this NID number.");
    }

    const { data, error } = await supabase.auth.signUp({
      email: values.email.trim().toLowerCase(),
      password: values.password,
      options: {
        data: {
          full_name: values.fullName.trim(),
          phone: values.phone.trim(),
          residential_address: values.address.trim(),
          nid_last4: nidCheck.normalizedNid.slice(-4),
          nid_fingerprint: nidCheck.fingerprint,
        },
      },
    });

    if (error) throw error;
    return data;
  }, [checkNidAvailability]);

  const signIn = React.useCallback(async (email, password) => {
    if (!supabase) throw new Error(missingConfigurationMessage);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw error;
    return data;
  }, []);

  const signOut = React.useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  const updateProfile = React.useCallback(
    async (updates) => {
      if (!supabase || !session?.user?.id) {
        throw new Error("You must be logged in to update your profile.");
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: updates.fullName.trim(),
          phone: updates.phone.trim(),
          residential_address: updates.address.trim(),
          preferred_language: updates.preferredLanguage,
          notification_enabled: updates.notificationEnabled,
        })
        .eq("id", session.user.id)
        .select("*")
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    },
    [session?.user?.id],
  );

  const value = React.useMemo(
    () => ({
      isConfigured: isSupabaseConfigured,
      session,
      user: session?.user ?? null,
      profile,
      loading,
      profileLoading,
      signUp,
      checkNidAvailability,
      signIn,
      signOut,
      updateProfile,
      refreshProfile: () => loadProfile(session?.user?.id),
    }),
    [
      session,
      profile,
      loading,
      profileLoading,
      signUp,
      checkNidAvailability,
      signIn,
      signOut,
      updateProfile,
      loadProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
