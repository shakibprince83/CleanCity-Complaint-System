// Supabase-backed administrator data and management operations.
import React from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const formatDate = (value) => value
  ? new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value))
  : "—";

const mapComplaint = (row, profiles, reviewDecisions) => {
  const reporter = profiles.get(row.citizen_id);
  const validity = reviewDecisions.get(row.id) || "Not reviewed";
  return {
    id: row.reference,
    databaseId: row.id,
    citizenId: row.citizen_id,
    title: row.title,
    description: row.description,
    category: row.category,
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    status: row.status,
    priority: row.priority,
    assignedTeam: row.assigned_team || "",
    adminNotes: row.admin_notes || "",
    date: formatDate(row.created_at),
    createdAt: row.created_at,
    reporterName: reporter?.full_name || "Citizen",
    reporterEmail: reporter?.email || "",
    reporterVerified: Boolean(reporter?.nid_verified),
    reporterTrustScore: Number(reporter?.trust_score ?? 0),
    reporterJoined: formatDate(reporter?.created_at),
    imagePath: row.image_path || "",
    validity,
  };
};

const mapUser = (row) => ({
  id: row.id,
  name: row.full_name,
  contact: row.email || row.phone,
  email: row.email || "",
  phone: row.phone,
  address: row.residential_address,
  type: row.role === "admin" ? "Admin" : row.role === "volunteer" ? "Volunteer" : "Citizen",
  role: row.role,
  joined: formatDate(row.created_at),
  createdAt: row.created_at,
  status: row.account_status === "active" ? "Active" : row.account_status === "suspended" ? "Suspended" : "Inactive",
  accountStatus: row.account_status,
  verified: Boolean(row.nid_verified),
  nidLast4: row.nid_last4,
  preferredLanguage: row.preferred_language,
  notificationEnabled: row.notification_enabled,
  trustScore: Number(row.trust_score ?? 0),
});

export function useAdminData() {
  const { user, profile } = useAuth();
  const [complaints, setComplaints] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const isAdmin = profile?.role === "admin" && profile?.account_status === "active";

  const refresh = React.useCallback(async () => {
    if (!supabase || !user?.id || !isAdmin) {
      setComplaints([]);
      setUsers([]);
      return;
    }
    setLoading(true);
    setError("");
    const [complaintResult, profileResult, reviewResult] = await Promise.all([
      supabase.from("complaints").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase
        .from("complaint_reviews")
        .select("complaint_id, decision, created_at")
        .order("created_at", { ascending: false }),
    ]);
    setLoading(false);
    const queryError = complaintResult.error || profileResult.error || reviewResult.error;
    if (queryError) {
      setError(queryError.message || "Administrator data could not be loaded.");
      return;
    }
    const profileMap = new Map((profileResult.data || []).map((item) => [item.id, item]));
    const reviewDecisions = new Map();
    (reviewResult.data || []).forEach((review) => {
      if (!reviewDecisions.has(review.complaint_id)) {
        reviewDecisions.set(review.complaint_id, review.decision);
      }
    });
    setUsers((profileResult.data || []).map(mapUser));
    setComplaints(
      (complaintResult.data || []).map((item) =>
        mapComplaint(item, profileMap, reviewDecisions),
      ),
    );
  }, [isAdmin, user?.id]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const updateComplaint = React.useCallback(async (complaintId, updates) => {
    if (!supabase || !isAdmin) throw new Error("Administrator access required.");
    const resolvedAt = updates.status === "Resolved" ? new Date().toISOString() : null;
    const { error: updateError } = await supabase
      .from("complaints")
      .update({
        status: updates.status,
        priority: updates.priority,
        assigned_team: updates.assignedTeam || null,
        admin_notes: updates.adminNotes || null,
        resolved_at: resolvedAt,
      })
      .eq("id", complaintId);
    if (updateError) throw updateError;
    await refresh();
  }, [isAdmin, refresh]);

  const updateUser = React.useCallback(async (userId, updates) => {
    if (!supabase || !isAdmin) throw new Error("Administrator access required.");
    const { error: updateError } = await supabase.rpc("admin_update_user", {
      target_user_id: userId,
      new_role: updates.role,
      new_status: updates.accountStatus,
      new_nid_verified: updates.verified,
    });
    if (updateError) throw updateError;
    await refresh();
  }, [isAdmin, refresh]);

  const deleteUser = React.useCallback(async (userId) => {
    if (!supabase || !isAdmin) throw new Error("Administrator access required.");
    const { error: deleteError } = await supabase.rpc("admin_delete_user", {
      target_user_id: userId,
    });
    if (deleteError) throw deleteError;
    await refresh();
  }, [isAdmin, refresh]);

  const saveAuthorityReport = React.useCallback(async (complaintId, report, reportId) => {
    if (!supabase || !isAdmin) throw new Error("Administrator access required.");
    const payload = {
      complaint_id: complaintId,
      authority: report.authority,
      subject: report.subject.trim(),
      details: report.details.trim(),
      response_deadline: report.responseDeadline || null,
      priority: report.priority,
      status: report.status,
      sent_at: report.status === "Sent" ? new Date().toISOString() : null,
    };
    let query = supabase.from("authority_reports");
    query = reportId ? query.update(payload).eq("id", reportId) : query.insert(payload);
    const { data, error: saveError } = await query.select().single();
    if (saveError) throw saveError;
    return data;
  }, [isAdmin]);

  const reviewComplaint = React.useCallback(async (complaintId, decision, notes) => {
    if (!supabase || !isAdmin) throw new Error("Administrator access required.");
    const { error: reviewError } = await supabase.rpc("admin_review_complaint", {
      target_complaint_id: complaintId,
      review_decision: decision,
      review_notes: notes || null,
    });
    if (reviewError) throw reviewError;
    await refresh();
  }, [isAdmin, refresh]);

  const applyPointPenalty = React.useCallback(async (complaintId, reason) => {
    if (!supabase || !isAdmin) throw new Error("Administrator access required.");
    const { data, error: penaltyError } = await supabase.rpc("admin_apply_trust_penalty", {
      target_complaint_id: complaintId,
      penalty_reason: reason,
    });
    if (penaltyError) throw penaltyError;
    await refresh();
    return Number(data);
  }, [isAdmin, refresh]);

  return {
    isAdmin,
    complaints,
    users,
    loading,
    error,
    refresh,
    updateComplaint,
    updateUser,
    deleteUser,
    saveAuthorityReport,
    reviewComplaint,
    applyPointPenalty,
  };
}
