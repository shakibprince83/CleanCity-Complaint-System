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
  const [passwordRecovery, setPasswordRecovery] = React.useState(false);

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
      (event, nextSession) => {
        setSession(nextSession);
        if (!nextSession) setProfile(null);
        if (event === "PASSWORD_RECOVERY") {
          setPasswordRecovery(true);
          window.location.hash = "/reset-password";
        }
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

    const registeredEmail = values.email.trim();
    const normalizedEmail = registeredEmail.toLowerCase();
    if (values.role === "Admin") {
      const { data: invited, error: inviteError } = await supabase.rpc(
        "admin_invite_is_valid",
        { candidate_email: normalizedEmail },
      );
      if (inviteError) throw inviteError;
      if (!invited) {
        throw new Error(
          "This email has not been invited as an administrator. Ask an existing administrator to create an invitation first.",
        );
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email: registeredEmail,
      password: values.password,
      options: {
        data: {
          full_name: values.fullName.trim(),
          phone: values.phone.trim(),
          residential_address: values.address.trim(),
          nid_last4: nidCheck.normalizedNid.slice(-4),
          nid_fingerprint: nidCheck.fingerprint,
          requested_role: values.role === "Admin" ? "admin" : "citizen",
          registered_email: registeredEmail,
        },
      },
    });

    if (error) throw error;
    if (data.session?.user?.id) {
      const createdProfile = await loadProfile(data.session.user.id);
      return { ...data, profile: createdProfile };
    }
    return data;
  }, [checkNidAvailability, loadProfile]);

  const signIn = React.useCallback(async (email, password) => {
    if (!supabase) throw new Error(missingConfigurationMessage);

    const enteredEmail = email.trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: enteredEmail,
      password,
    });

    if (error) throw error;
    const signedInProfile = await loadProfile(data.user.id);
    const registeredEmail =
      signedInProfile?.email || data.user?.user_metadata?.registered_email;

    if (!registeredEmail || enteredEmail !== registeredEmail) {
      await supabase.auth.signOut();
      setProfile(null);
      throw new Error("Invalid login credentials");
    }

    return { ...data, profile: signedInProfile };
  }, [loadProfile]);

  const requestPasswordReset = React.useCallback(async (email) => {
    if (!supabase) throw new Error(missingConfigurationMessage);
    const resetEmail = email.trim();
    if (!resetEmail) throw new Error("Enter your registered email address.");

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }, []);

  const updateRecoveredPassword = React.useCallback(async (newPassword) => {
    if (!supabase) throw new Error(missingConfigurationMessage);
    if (!session?.user?.email || !passwordRecovery) {
      throw new Error("Open the latest password reset link sent to your email.");
    }
    if (newPassword.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

    const currentPasswordCheck = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: newPassword,
    });

    if (!currentPasswordCheck.error) {
      throw new Error("The new password cannot be the same as your current password.");
    }

    const isExpectedMismatch =
      currentPasswordCheck.error.message
        ?.toLowerCase()
        .includes("invalid login credentials");
    if (!isExpectedMismatch) throw currentPasswordCheck.error;

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;

    setPasswordRecovery(false);
    await supabase.auth.signOut();
    setProfile(null);
  }, [passwordRecovery, session?.user?.email]);

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
          ...(updates.department !== undefined
            ? { department: updates.department.trim() }
            : {}),
          ...(updates.adminTitle !== undefined
            ? { admin_title: updates.adminTitle.trim() }
            : {}),
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
      passwordRecovery,
      signUp,
      checkNidAvailability,
      signIn,
      requestPasswordReset,
      updateRecoveredPassword,
      signOut,
      updateProfile,
      refreshProfile: () => loadProfile(session?.user?.id),
    }),
    [
      session,
      profile,
      loading,
      profileLoading,
      passwordRecovery,
      signUp,
      checkNidAvailability,
      signIn,
      requestPasswordReset,
      updateRecoveredPassword,
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
