// Supabase-backed complaint and notification data for the signed-in citizen.
import React from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const CitizenDataContext = React.createContext(null);

const complaintErrorMessage = (error) => {
  if (
    error?.code === "PGRST205" ||
    error?.message?.includes("schema cache") ||
    error?.message?.includes("public.complaints")
  ) {
    return "Complaint service is being configured. Please try again after the database setup is completed.";
  }
  return error?.message || "The complaint could not be submitted. Please try again.";
};

const formatDate = (value) => value ? new Intl.DateTimeFormat("en-GB", {
  day: "2-digit", month: "short", year: "numeric",
}).format(new Date(value)) : "";

const toComplaint = (row) => ({
  id: row.reference, databaseId: row.id, title: row.title,
  category: row.category, location: row.location, latitude: row.latitude,
  longitude: row.longitude, date: formatDate(row.created_at),
  createdAt: row.created_at, status: row.status, priority: row.priority,
  description: row.description, imagePath: row.image_path,
});

const toNotification = (row) => ({
  id: row.id,
  complaintId: row.complaint_id,
  title: row.title,
  message: row.message,
  time: formatDate(row.created_at),
  unread: !row.read_at,
  tone: row.tone,
});

export function CitizenDataProvider({ children }) {
  const { user } = useAuth();
  const [complaints, setComplaints] = React.useState([]);
  const [notifications, setNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const refresh = React.useCallback(async () => {
    if (!supabase || !user?.id) {
      setComplaints([]);
      setNotifications([]);
      return;
    }
    setLoading(true);
    setError("");
    const [complaintResult, notificationResult] = await Promise.all([
      supabase.from("complaints").select("*").eq("citizen_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").eq("citizen_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setLoading(false);
    const queryError = complaintResult.error || notificationResult.error;
    if (queryError) {
      setError("Your dashboard data could not be loaded. Apply the latest Supabase migration, then refresh this page.");
      return;
    }
    setComplaints((complaintResult.data || []).map(toComplaint));
    setNotifications((notificationResult.data || []).map(toNotification));
  }, [user?.id]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const addComplaint = React.useCallback(async (payload) => {
    if (!supabase || !user?.id) throw new Error("You must be logged in to submit a complaint.");
    let imagePath = null;
    if (payload.imageFile) {
      const extension = payload.imageFile.type === "image/png" ? "png" : "jpg";
      imagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("complaint-evidence")
        .upload(imagePath, payload.imageFile, {
          contentType: payload.imageFile.type,
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) {
        throw new Error(uploadError.message || "The complaint photo could not be uploaded.");
      }
    }

    const { data, error: insertError } = await supabase.from("complaints").insert({
      citizen_id: user.id,
      title: payload.title.trim(), description: payload.description.trim(),
      category: payload.category, location: payload.location.trim(),
      latitude: payload.latitude, longitude: payload.longitude,
      image_path: imagePath,
      priority: payload.category === "Emergency" ? "Urgent" : "Normal",
    }).select("*").single();
    if (insertError) {
      if (imagePath) {
        await supabase.storage.from("complaint-evidence").remove([imagePath]);
      }
      throw new Error(complaintErrorMessage(insertError));
    }
    const complaint = toComplaint(data);
    setComplaints((current) => [complaint, ...current]);
    await refresh();
    return complaint;
  }, [refresh, user?.id]);

  const markNotificationRead = React.useCallback(async (notificationId) => {
    if (!supabase || !user?.id || !notificationId) return;
    const { error: updateError } = await supabase.from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("citizen_id", user.id);
    if (updateError) throw updateError;
    setNotifications((current) => current.map((item) => (
      item.id === notificationId ? { ...item, unread: false } : item
    )));
  }, [user?.id]);

  const markAllRead = React.useCallback(async () => {
    if (!supabase || !user?.id) return;
    const { error: updateError } = await supabase.from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("citizen_id", user.id).is("read_at", null);
    if (updateError) throw updateError;
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
  }, [user?.id]);

  const value = React.useMemo(() => ({
    complaints,
    notifications,
    loading,
    error,
    refresh,
    addComplaint,
    markNotificationRead,
    markAllRead,
  }), [
    complaints,
    notifications,
    loading,
    error,
    refresh,
    addComplaint,
    markNotificationRead,
    markAllRead,
  ]);

  return <CitizenDataContext.Provider value={value}>{children}</CitizenDataContext.Provider>;
}

export function useCitizenData() {
  const context = React.useContext(CitizenDataContext);
  if (!context) throw new Error("useCitizenData must be used inside CitizenDataProvider.");
  return context;
}
