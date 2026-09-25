// Supabase-backed administrator activity notifications and per-admin read state.
import React from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const mapNotification = (row, readIds) => ({
  id: row.id,
  actorId: row.actor_id,
  actionType: row.action_type,
  entityType: row.entity_type,
  entityId: row.entity_id,
  title: row.title,
  message: row.message,
  tone: row.tone,
  createdAt: row.created_at,
  read: readIds.has(row.id),
});

export function useAdminNotifications(enabled = true) {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const isAdmin =
    enabled &&
    profile?.role === "admin" &&
    profile?.account_status === "active";

  const refresh = React.useCallback(async () => {
    if (!supabase || !user?.id || !isAdmin) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    setError("");

    const [notificationResult, readResult] = await Promise.all([
      supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(75),
      supabase
        .from("admin_notification_reads")
        .select("notification_id, read_at")
        .eq("admin_id", user.id),
    ]);

    setLoading(false);
    const loadError = notificationResult.error || readResult.error;
    if (loadError) {
      setError(loadError.message || "Administrator notifications could not be loaded.");
      return;
    }

    const readIds = new Set(
      (readResult.data || []).map((item) => item.notification_id),
    );
    setNotifications(
      (notificationResult.data || []).map((item) =>
        mapNotification(item, readIds),
      ),
    );
  }, [isAdmin, user?.id]);

  React.useEffect(() => {
    if (!isAdmin) return undefined;

    refresh();
    const timer = window.setInterval(refresh, 30000);
    const handleFocus = () => refresh();
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAdmin, refresh]);

  const markRead = React.useCallback(async (notificationId) => {
    if (!supabase || !user?.id || !isAdmin) return;

    const { error: readError } = await supabase
      .from("admin_notification_reads")
      .upsert(
        {
          notification_id: notificationId,
          admin_id: user.id,
          read_at: new Date().toISOString(),
        },
        { onConflict: "notification_id,admin_id" },
      );

    if (readError) throw readError;
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      ),
    );
  }, [isAdmin, user?.id]);

  const markAllRead = React.useCallback(async () => {
    if (!supabase || !user?.id || !isAdmin) return;

    const unread = notifications.filter((item) => !item.read);
    if (!unread.length) return;

    const readAt = new Date().toISOString();
    const { error: readError } = await supabase
      .from("admin_notification_reads")
      .upsert(
        unread.map((item) => ({
          notification_id: item.id,
          admin_id: user.id,
          read_at: readAt,
        })),
        { onConflict: "notification_id,admin_id" },
      );

    if (readError) throw readError;
    setNotifications((current) =>
      current.map((item) => ({ ...item, read: true })),
    );
  }, [isAdmin, notifications, user?.id]);

  return {
    notifications,
    unreadCount: notifications.filter((item) => !item.read).length,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
  };
}
