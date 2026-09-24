// Administrator pages for complaint review, users, reports and trust decisions.
import React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileCheck2,
  FileText,
  Filter,
  Flag,
  Mail,
  MapPin,
  MessageSquareText,
  MoreHorizontal,
  PenLine,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  Undo2,
  User,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import {
  AppShell,
  Badge,
  Button,
  EmptyState,
  Field,
  PageHeading,
  Panel,
  SearchBox,
  StatCard,
  StatusBadge,
  Tick,
  TrustRing,
} from "../components/Common";
import { useAuth } from "../context/AuthContext";

const Shell = ({ screen, navigate, children }) => (
  <AppShell
    type="admin"
    active={screen}
    navigate={navigate}
    onPreview={() => navigate("preview")}
  >
    {children}
  </AppShell>
);

export function AdminDashboard({
  navigate,
  complaints,
  loading,
  error,
  refresh,
  selectComplaint,
}) {
  const total = complaints.length;
  const pending = complaints.filter((item) =>
    ["Pending", "Under Review"].includes(item.status),
  ).length;
  const inProgress = complaints.filter((item) =>
    ["Assigned", "In Progress"].includes(item.status),
  ).length;
  const resolved = complaints.filter((item) => item.status === "Resolved").length;
  const urgent = complaints.filter((item) =>
    ["Urgent", "High"].includes(item.priority),
  );
  const dailyActivity = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    return complaints.filter((item) => {
      const created = new Date(item.createdAt).getTime();
      return created >= day.getTime() && created < nextDay.getTime();
    }).length;
  });
  const maxActivity = Math.max(...dailyActivity, 1);
  const resolutionRate = total ? Math.round((resolved / total) * 100) : 0;

  return (
    <Shell screen="admin-dashboard" navigate={navigate}>
      <PageHeading
        eyebrow="CITY OPERATIONS"
        title="Admin dashboard"
        description="Review complaint activity and direct the response from one workspace."
        actions={
          <>
            <Button variant="outline" icon={RefreshCw} onClick={refresh}>
              Refresh
            </Button>
            <Button icon={FileText} onClick={() => navigate("manage-complaints")}>
              Manage complaints
            </Button>
          </>
        }
      />
      {error && <p className="form-message form-message--error">{error}</p>}
      <div className="stats-grid">
        <StatCard label="Total complaints" value={String(total)} note="Database records" icon={FileText} selected />
        <StatCard label="Pending review" value={String(pending)} note="Awaiting administrative action" icon={Clock} tone="gold" />
        <StatCard label="In progress" value={String(inProgress)} note="Assigned or being handled" icon={Activity} tone="blue" />
        <StatCard label="Resolved" value={String(resolved)} note={`${resolutionRate}% resolution rate`} icon={CheckCircle2} tone="green" />
      </div>
      <div className="admin-dashboard-grid">
        <Panel title="Complaint activity" className="span-2 chart-panel">
          <div className="admin-bars">
            {dailyActivity.map((value, index) => (
              <div key={index}>
                <span style={{ height: `${Math.max(6, (value / maxActivity) * 100)}%` }}>
                  <i>{value}</i>
                </span>
                <small>{new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(Date.now() - ((6 - index) * 86400000)))}</small>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span><i className="legend-green" />Submitted complaints</span>
            <strong>{total} <small>total records</small></strong>
          </div>
        </Panel>
        <Panel title="Status overview" className="status-overview">
          <div className="donut" style={{ "--resolved": `${resolutionRate}%`, "--progress": `${total ? Math.round((inProgress / total) * 100) : 0}%` }}>
            <div><strong>{total}</strong><small>Total</small></div>
          </div>
          <div className="donut-legend">
            <span><i className="green" />Resolved <strong>{resolved}</strong></span>
            <span><i className="blue" />In progress <strong>{inProgress}</strong></span>
            <span><i className="gold" />Pending <strong>{pending}</strong></span>
          </div>
        </Panel>
        <Panel title="Requires attention" action={<Badge tone="red">{urgent.length} URGENT</Badge>} className="span-2">
          {loading ? (
            <EmptyState title="Loading complaints…" description="Fetching live complaint records." />
          ) : urgent.length ? (
            <div className="attention-list">
              {urgent.slice(0, 4).map((item) => (
                <button key={item.databaseId} onClick={() => selectComplaint(item)}>
                  <span className={`priority-marker priority-marker--${item.priority.toLowerCase()}`}><Flag size={17} /></span>
                  <span><strong>{item.title}</strong><small>{item.id} · {item.location}</small></span>
                  <StatusBadge status={item.priority} />
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState title="No urgent complaints" description="High-priority complaints will appear here." />
          )}
        </Panel>
        <Panel className="review-queue-card">
          <span className="review-queue-card__icon"><ClipboardCheck size={25} /></span>
          <Badge tone="gold">{pending} WAITING</Badge>
          <h3>Validity review queue</h3>
          <p>Verify evidence and reporter information before assignment.</p>
          <Button variant="light" onClick={() => navigate("manage-complaints")}>
            Start reviewing <ArrowRight size={16} />
          </Button>
        </Panel>
      </div>
    </Shell>
  );
}

export function ManageComplaints({
  navigate,
  complaints,
  loading,
  error,
  refresh,
  selectComplaint,
}) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("All statuses");
  const filtered = complaints.filter(
    (item) =>
      `${item.id} ${item.title} ${item.location}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "All statuses" || item.status === status),
  );
  return (
    <Shell screen="manage-complaints" navigate={navigate}>
      <PageHeading
        eyebrow="OPERATIONS"
        title="Manage complaints"
        description="Search, review, assign and update complaints across all service zones."
        actions={
          <Button variant="outline" icon={RefreshCw} onClick={refresh}>
            Refresh data
          </Button>
        }
      />
      {error && <p className="form-message form-message--error">{error}</p>}
      <Panel className="table-panel">
        <div className="toolbar toolbar--admin">
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search complaint ID, title or area"
          />
          <label className="select-control">
            <Filter size={17} />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option>All statuses</option>
              <option>Pending</option>
              <option>Under Review</option>
              <option>Assigned</option>
              <option>In Progress</option>
              <option>Resolved</option>
              <option>Rejected</option>
            </select>
          </label>
          <label className="select-control">
            <MapPin size={17} />
            <select>
              <option>All zones</option>
              <option>North Zone</option>
              <option>Central Zone</option>
              <option>South Zone</option>
            </select>
          </label>
          <Button variant="outline" icon={SlidersHorizontal}>
            Apply filters
          </Button>
        </div>
        <div className="table-summary">
          <span>
            <strong>{filtered.length}</strong> complaints found
          </span>
          <span>Updated just now</span>
        </div>
        <div className="data-table-wrap">
          <table className="data-table data-table--admin">
            <thead>
              <tr>
                <th>Complaint</th>
                <th>Location</th>
                <th>Submitted</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="table-title">
                      <span className="complaint-initial">
                        {item.category.slice(0, 1)}
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>
                          {item.id} · {item.category}
                        </small>
                      </span>
                    </span>
                  </td>
                  <td>
                    <span className="location-cell">
                      <MapPin size={14} />
                      {item.location}
                    </span>
                  </td>
                  <td>{item.date}</td>
                  <td>
                    <StatusBadge status={item.priority} />
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    <div className="table-actions">
                      <Button
                        variant="small"
                        onClick={() => selectComplaint?.(item)}
                      >
                        View
                      </Button>
                      <button>
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && (
                <tr><td colSpan="6">Loading live complaint records…</td></tr>
              )}
              {!loading && !filtered.length && (
                <tr><td colSpan="6">No complaints match the selected filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>
            Showing 1–{filtered.length} of {filtered.length}
          </span>
          <div>
            <button disabled>Previous</button>
            <button className="active">1</button>
            <button disabled>Next</button>
          </div>
        </div>
      </Panel>
    </Shell>
  );
}

export function EditComplaint({
  navigate,
  complaint,
  showToast,
  updateComplaint,
}) {
  const [status, setStatus] = React.useState(complaint.status);
  const [priority, setPriority] = React.useState(complaint.priority);
  const [assignedTeam, setAssignedTeam] = React.useState(complaint.assignedTeam || "");
  const [adminNotes, setAdminNotes] = React.useState(complaint.adminNotes || "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setStatus(complaint.status);
    setPriority(complaint.priority);
    setAssignedTeam(complaint.assignedTeam || "");
    setAdminNotes(complaint.adminNotes || "");
  }, [complaint]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await updateComplaint(complaint.databaseId, {
        status,
        priority,
        assignedTeam,
        adminNotes,
      });
      showToast("Complaint updated and the citizen was notified");
      navigate("manage-complaints");
    } catch (saveError) {
      setError(saveError.message || "The complaint could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell screen="manage-complaints" navigate={navigate}>
      <PageHeading
        eyebrow={`EDITING ${complaint.id}`}
        title="Review and update complaint"
        description={complaint.title}
        actions={<StatusBadge status={complaint.status} />}
      />
      {error && <p className="form-message form-message--error">{error}</p>}
      <div className="edit-layout">
        <div className="edit-main">
          <Panel title="Complaint information">
            <div className="summary-banner">
              <span className="summary-banner__icon"><FileText size={23} /></span>
              <div>
                <Badge tone="green">{complaint.category}</Badge>
                <h3>{complaint.title}</h3>
                <p>{complaint.description}</p>
              </div>
            </div>
            <div className="info-grid info-grid--four">
              <Info label="Reporter" value={complaint.reporterName} />
              <Info label="Submitted" value={complaint.date} />
              <Info label="Location" value={complaint.location} />
              <Info label="Verification" value={complaint.reporterVerified ? "Verified" : "Pending"} />
            </div>
          </Panel>
          <Panel title="Administrative notes">
            <Field label="Internal notes" hint="Visible only to administrators.">
              <textarea rows="7" value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} />
            </Field>
          </Panel>
          <Panel title="Record information">
            <div className="admin-history">
              <span>
                <i><Check size={13} /></i>
                <div>
                  <strong>Complaint submitted</strong>
                  <small>{complaint.reporterName} · {complaint.date}</small>
                </div>
              </span>
              <span>
                <i><UserCheck size={13} /></i>
                <div>
                  <strong>Current database status: {complaint.status}</strong>
                  <small>{complaint.assignedTeam || "No response team assigned"}</small>
                </div>
              </span>
            </div>
          </Panel>
        </div>
        <div className="edit-sidebar">
          <Panel title="Update workflow">
            <Field label="Complaint status">
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option>Pending</option>
                <option>Under Review</option>
                <option>Assigned</option>
                <option>In Progress</option>
                <option>Resolved</option>
                <option>Rejected</option>
              </select>
            </Field>
            <Field label="Priority level">
              <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option>Normal</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </Field>
            <Field label="Assign staff or team">
              <select value={assignedTeam} onChange={(event) => setAssignedTeam(event.target.value)}>
                <option value="">Not assigned</option>
                <option>North Zone Team A</option>
                <option>North Zone Team B</option>
                <option>Central Response Team</option>
              </select>
            </Field>
            <div className="assignee-card">
              <span>RT</span>
              <div>
                <strong>{assignedTeam || "No team assigned"}</strong>
                <small>Saved securely with this complaint</small>
              </div>
              <strong className="availability-text">{assignedTeam ? "ASSIGNED" : "WAITING"}</strong>
            </div>
          </Panel>
          <Panel className="save-panel">
            <div>
              <ShieldCheck size={20} />
              <span>
                <strong>Changes are ready</strong>
                <small>Status changes create a citizen notification.</small>
              </span>
            </div>
            <div>
              <Button variant="ghost" onClick={() => navigate("manage-complaints")}>Cancel</Button>
              <Button icon={Save} onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}

export function UserManagement({
  navigate,
  users,
  loading,
  error,
  refresh,
  selectUser,
}) {
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState("All user types");
  const [status, setStatus] = React.useState("All statuses");
  const filtered = users.filter((item) => {
    const matchesQuery = `${item.name} ${item.contact} ${item.type}`
      .toLowerCase().includes(query.toLowerCase());
    const matchesType = type === "All user types" || item.type === type;
    const matchesStatus = status === "All statuses" || item.status === status;
    return matchesQuery && matchesType && matchesStatus;
  });
  const activeCount = users.filter((item) => item.status === "Active").length;
  const verifiedCount = users.filter((item) => item.verified).length;
  const adminCount = users.filter((item) => item.role === "admin").length;

  return (
    <Shell screen="user-management" navigate={navigate}>
      <PageHeading
        eyebrow="ACCESS CONTROL"
        title="User management"
        description="Review registered citizens and administrators."
        actions={<Button variant="outline" icon={RefreshCw} onClick={refresh}>Refresh data</Button>}
      />
      {error && <p className="form-message form-message--error">{error}</p>}
      <div className="user-stats">
        <article><Users size={20} /><span><strong>{users.length}</strong><small>Total users</small></span></article>
        <article><UserCheck size={20} /><span><strong>{activeCount}</strong><small>Active accounts</small></span></article>
        <article><BadgeCheck size={20} /><span><strong>{verifiedCount}</strong><small>NID verified</small></span></article>
        <article><Briefcase size={20} /><span><strong>{adminCount}</strong><small>Administrators</small></span></article>
      </div>
      <Panel className="table-panel">
        <div className="toolbar toolbar--admin">
          <SearchBox value={query} onChange={setQuery} placeholder="Search users" />
          <label className="select-control">
            <Users size={17} />
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option>All user types</option>
              <option>Citizen</option>
              <option>Volunteer</option>
              <option>Admin</option>
            </select>
          </label>
          <label className="select-control">
            <Shield size={17} />
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>All statuses</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Suspended</option>
            </select>
          </label>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>User</th><th>Email or phone</th><th>Type</th><th>Joined</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {!loading && filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="user-cell">
                      <i>{item.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</i>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.id.slice(0, 8)}{item.verified && " · NID verified"}</small>
                      </span>
                    </span>
                  </td>
                  <td>{item.contact}</td>
                  <td><Badge tone={item.type === "Citizen" ? "blue" : "violet"}>{item.type}</Badge></td>
                  <td>{item.joined}</td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>
                    <Button variant="small" onClick={() => selectUser?.(item)}>Edit</Button>
                  </td>
                </tr>
              ))}
              {loading && <tr><td colSpan="6">Loading registered users…</td></tr>}
              {!loading && !filtered.length && <tr><td colSpan="6">No users match the selected filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </Panel>
    </Shell>
  );
}

export function EditUser({
  navigate,
  user,
  showToast,
  updateUser,
}) {
  const [role, setRole] = React.useState(user.role);
  const [accountStatus, setAccountStatus] = React.useState(user.accountStatus);
  const [verified, setVerified] = React.useState(user.verified);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    setRole(user.role);
    setAccountStatus(user.accountStatus);
    setVerified(user.verified);
  }, [user]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await updateUser(user.id, { role, accountStatus, verified });
      showToast("User account updated successfully");
      navigate("user-management");
    } catch (saveError) {
      setError(saveError.message || "The user account could not be updated.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell screen="user-management" navigate={navigate}>
      <PageHeading
        eyebrow={`USER ${user.id.slice(0, 8)}`}
        title="Edit user"
        description="Update verification, role and account access."
        actions={<StatusBadge status={user.status} />}
      />
      {error && <p className="form-message form-message--error">{error}</p>}
      <div className="edit-layout">
        <div className="edit-main">
          <Panel title="Profile information">
            <div className="edit-profile-head">
              <span>
                {user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                <i><BadgeCheck size={16} /></i>
              </span>
              <div><h3>{user.name}</h3><p>{user.type} · Member since {user.joined}</p></div>
            </div>
            <div className="form-grid form-grid--two">
              <Field label="Full name"><input value={user.name} disabled /></Field>
              <Field label="Email address"><input value={user.email} disabled /></Field>
              <Field label="Phone number"><input value={user.phone} disabled /></Field>
              <Field label="Home area"><input value={user.address} disabled /></Field>
            </div>
          </Panel>
          <Panel title="Account settings">
            <div className="form-grid form-grid--two">
              <Field label="User type">
                <select value={role} onChange={(event) => setRole(event.target.value)}>
                  <option value="citizen">Citizen</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>
              <Field label="Account status">
                <select value={accountStatus} onChange={(event) => setAccountStatus(event.target.value)}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </Field>
              <Field label="Preferred language"><input value={user.preferredLanguage} disabled /></Field>
              <Field label="Notifications"><input value={user.notificationEnabled ? "Enabled" : "Disabled"} disabled /></Field>
            </div>
          </Panel>
        </div>
        <div className="edit-sidebar">
          <Panel title="Identity verification">
            <div className="verification-profile">
              <span><BadgeCheck size={27} /></span>
              <h3>{verified ? "NID verified" : "NID pending"}</h3>
              <p>•••• {user.nidLast4 || "Not provided"}</p>
            </div>
            <label className="check-row">
              <input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} />
              <span>Confirm NID verification</span>
            </label>
          </Panel>
          <Panel title="Security">
            <div className="security-list">
              <span><small>Account created</small><strong>{user.joined}</strong></span>
              <span><small>Current access</small><strong>{user.status}</strong></span>
            </div>
            <p>Authentication passwords remain managed securely by Supabase Auth.</p>
          </Panel>
          <div className="sticky-actions">
            <Button variant="ghost" onClick={() => navigate("user-management")}>Cancel</Button>
            <Button icon={Save} onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save user"}
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function AdminProfile({ navigate, showToast }) {
  const { user, profile, updateProfile } = useAuth();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    fullName: "",
    phone: "",
    address: "",
    department: "",
    adminTitle: "",
    preferredLanguage: "English",
    notificationEnabled: true,
  });

  React.useEffect(() => {
    if (!profile) return;
    setForm({
      fullName: profile.full_name || "",
      phone: profile.phone || "",
      address: profile.residential_address || "",
      department: profile.department || "City Operations",
      adminTitle: profile.admin_title || "System Administrator",
      preferredLanguage: profile.preferred_language || "English",
      notificationEnabled: profile.notification_enabled ?? true,
    });
  }, [profile]);

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      setEditing(false);
      showToast("Administrator profile updated");
    } catch (saveError) {
      showToast(saveError.message || "Administrator profile could not be updated");
    } finally {
      setSaving(false);
    }
  };

  const initials = (form.fullName || user?.email || "A")
    .split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Shell screen="admin-profile" navigate={navigate}>
      <PageHeading
        eyebrow="ADMINISTRATOR ACCOUNT"
        title="My profile"
        description="View and update your administrator information."
        actions={
          editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button icon={Save} onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
            </>
          ) : (
            <Button icon={PenLine} onClick={() => setEditing(true)}>Edit profile</Button>
          )
        }
      />
      <div className="profile-layout admin-profile-layout">
        <Panel className="profile-identity admin-profile-identity">
          <div className="profile-avatar">
            {initials}<span><ShieldCheck size={18} /></span>
          </div>
          <h2>{form.fullName || user?.email}</h2>
          <Badge tone="green">ACTIVE ADMIN</Badge>
          <p>{form.adminTitle}</p>
          <div className="profile-contact">
            <span><Mail size={17} />{user?.email}</span>
            <span><User size={17} />{form.department}</span>
            <span><Shield size={17} />Full administrative access</span>
          </div>
        </Panel>
        <div className="profile-main">
          <Panel title="Administrator information">
            <div className="form-grid form-grid--two">
              <Field label="Full name"><input value={form.fullName} onChange={update("fullName")} disabled={!editing} /></Field>
              <Field label="Email address"><input value={user?.email || ""} disabled /></Field>
              <Field label="Phone number"><input value={form.phone} onChange={update("phone")} disabled={!editing} /></Field>
              <Field label="Department"><input value={form.department} onChange={update("department")} disabled={!editing} /></Field>
              <Field label="Administrator role"><input value={form.adminTitle} onChange={update("adminTitle")} disabled={!editing} /></Field>
              <Field label="Account status"><input value={profile?.account_status || "active"} disabled /></Field>
            </div>
          </Panel>
          <Panel title="Account security">
            <div className="security-list">
              <span><small>Account created</small><strong>{profile?.created_at ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(profile.created_at)) : "—"}</strong></span>
              <span><small>Access level</small><strong>{form.adminTitle}</strong></span>
              <span><small>Authentication</small><strong>Supabase Auth</strong></span>
            </div>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}

export function VerificationReview({ navigate, user, showToast }) {
  return (
    <Shell screen="user-management" navigate={navigate}>
      <PageHeading
        eyebrow={`IDENTITY REVIEW · ${user.id}`}
        title="Review identity verification"
        description="Review the citizen's submitted identity information and verification record."
        actions={
          <Button variant="outline" onClick={() => navigate("edit-user")}>
            Back to user
          </Button>
        }
      />
      <div className="verification-review-layout">
        <Panel title="Submitted identity">
          <div className="verification-document">
            <ShieldCheck size={46} />
            <span>
              <strong>National ID document</strong>
              <small>Protected demonstration preview</small>
            </span>
          </div>
          <div className="info-grid">
            <Info label="Citizen name" value={user.name} />
            <Info label="NID number" value="DEMO •••• 0001" />
            <Info label="Submitted" value="19 Aug 2026" />
            <Info label="Current result" value="Verified" />
          </div>
        </Panel>
        <Panel title="Verification checks">
          <div className="checklist">
            <article>
              <Tick />
              <span>
                <strong>Name matched</strong>
                <small>Profile and document names are consistent.</small>
              </span>
              <Badge tone="green">PASSED</Badge>
            </article>
            <article>
              <Tick />
              <span>
                <strong>Document checked</strong>
                <small>The submitted document passed the demo review.</small>
              </span>
              <Badge tone="green">PASSED</Badge>
            </article>
            <article>
              <Tick />
              <span>
                <strong>Account ownership</strong>
                <small>Contact details belong to the registered citizen.</small>
              </span>
              <Badge tone="green">PASSED</Badge>
            </article>
          </div>
          <div className="verification-review-actions">
            <Button
              variant="outline"
              onClick={() => showToast("Verification sent back for review")}
            >
              Request recheck
            </Button>
            <Button
              icon={CheckCircle2}
              onClick={() => {
                showToast("Identity verification confirmed");
                navigate("edit-user");
              }}
            >
              Confirm verification
            </Button>
          </div>
        </Panel>
      </div>
    </Shell>
  );
}

export function ReportAuthority({ navigate, complaint, showToast }) {
  return (
    <Shell screen="report-authority" navigate={navigate}>
      <PageHeading
        eyebrow="EXTERNAL REPORT"
        title="Report to relevant authority"
        description="Prepare an official report for a complaint requiring external action."
        actions={<Badge tone="gold">DRAFT</Badge>}
      />
      <div className="report-layout">
        <Panel title="Report details" className="report-form">
          <div className="form-grid form-grid--two">
            <Field label="Complaint reference">
              <input defaultValue={complaint.id} />
            </Field>
            <Field label="Relevant authority">
              <select defaultValue="Dhaka North City Corporation">
                <option>Dhaka North City Corporation</option>
                <option>Dhaka Metropolitan Police</option>
                <option>Fire Service and Civil Defence</option>
              </select>
            </Field>
          </div>
          <Field label="Report subject">
            <input
              defaultValue={`Urgent response requested for ${complaint.id}`}
            />
          </Field>
          <Field label="Report details">
            <textarea
              rows="9"
              defaultValue={`CleanCity requests an on-site review of the reported issue at ${complaint.location}. The citizen evidence and location details have passed the initial administrative review.`}
            />
          </Field>
          <div className="form-grid form-grid--two">
            <Field label="Response deadline">
              <input type="date" defaultValue="2026-09-13" />
            </Field>
            <Field label="Priority level">
              <select defaultValue="High">
                <option>Normal</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </Field>
          </div>
          <div className="attachment-row">
            <span>
              <FileCheck2 size={20} />
              <span>
                <strong>Complaint evidence package</strong>
                <small>Photo, location and review summary · 2.4 MB</small>
              </span>
            </span>
            <Badge tone="green">ATTACHED</Badge>
          </div>
          <div className="report-actions">
            <Button
              variant="outline"
              icon={Save}
              onClick={() => showToast("Report draft saved")}
            >
              Save draft
            </Button>
            <Button
              icon={Send}
              onClick={() => showToast("Authority report sent successfully")}
            >
              Send report
            </Button>
          </div>
        </Panel>
        <div className="report-side">
          <Panel title="Complaint summary">
            <div className="report-summary">
              <Badge tone="green">{complaint.category}</Badge>
              <h3>{complaint.title}</h3>
              <p>{complaint.id}</p>
              <span>
                <MapPin size={16} />
                {complaint.location}
              </span>
              <span>
                <User size={16} />
                Demo Citizen · Verified
              </span>
              <StatusBadge status={complaint.status} />
            </div>
          </Panel>
          <Panel title="Report history">
            <div className="report-history">
              <span>
                <i>
                  <FileText size={15} />
                </i>
                <div>
                  <strong>Draft opened</strong>
                  <small>Today, 09:18 AM · Demo Administrator</small>
                </div>
              </span>
              <span>
                <i>
                  <Check size={15} />
                </i>
                <div>
                  <strong>Evidence attached</strong>
                  <small>Today, 09:20 AM · Automatic</small>
                </div>
              </span>
            </div>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}

export function ValidityReview({ navigate, complaint }) {
  const checks = [
    ["Photo evidence is clear", "Visible location and issue details", true],
    [
      "Location information is consistent",
      "GPS and entered address match",
      true,
    ],
    [
      "Complaint description is specific",
      "Contains issue, impact and landmark",
      true,
    ],
    ["Duplicate report check", "No matching complaint within 100 metres", true],
  ];
  return (
    <Shell screen="admin-dashboard" navigate={navigate}>
      <div className="validity-review-page">
        <PageHeading
          eyebrow="VALIDITY REVIEW · 01 OF 07"
          title="Review complaint validity"
          description="Check the evidence and reporter record before confirming the complaint."
          actions={<Badge tone="gold">REVIEW QUEUE</Badge>}
        />
        <div className="review-layout">
          <div className="review-main">
            <Panel className="review-hero">
              <div>
                <Badge tone="green">{complaint.category}</Badge>
                <h2>{complaint.title}</h2>
                <p>{complaint.id} · Submitted 08 Sep 2026, 09:42 AM</p>
              </div>
              <div className="confidence">
                <span>
                  <strong>92%</strong>
                  <small>validity confidence</small>
                </span>
                <div>
                  <i style={{ width: "92%" }} />
                </div>
                <small>Strong evidence consistency</small>
              </div>
            </Panel>
            <Panel title="Evidence and consistency checks">
              <div className="checklist">
                {checks.map(([title, text, checked]) => (
                  <article key={title}>
                    <Tick checked={checked} />
                    <div>
                      <strong>{title}</strong>
                      <small>{text}</small>
                    </div>
                    <Badge tone="green">PASSED</Badge>
                  </article>
                ))}
              </div>
            </Panel>
            <Panel title="Complaint snapshot">
              <div className="snapshot-grid">
                <div className="snapshot-photo">
                  <FileText size={44} />
                  <span>Evidence preview</span>
                </div>
                <div>
                  <p>{complaint.description}</p>
                  <span>
                    <MapPin size={16} />
                    {complaint.location}
                  </span>
                  <span>
                    <BadgeCheck size={16} />
                    Reporter identity verified
                  </span>
                </div>
              </div>
            </Panel>
          </div>
          <div className="review-side">
            <Panel title="Reporter trust">
              <div className="trust-profile">
                <TrustRing value={86} />
                <h3>Demo Citizen</h3>
                <p>Verified citizen · 12 reports</p>
                <Badge tone="green">EXCELLENT STANDING</Badge>
              </div>
              <div className="trust-facts">
                <span>
                  <small>Valid reports</small>
                  <strong>11</strong>
                </span>
                <span>
                  <small>Point penalties</small>
                  <strong>0</strong>
                </span>
                <span>
                  <small>Member since</small>
                  <strong>Aug 2026</strong>
                </span>
              </div>
            </Panel>
            <Panel className="fairness-card">
              <span>
                <ShieldCheck size={21} />
              </span>
              <div>
                <strong>Fairness check</strong>
                <p>
                  Base the decision only on complaint evidence and consistency.
                  Trust score is supporting information.
                </p>
              </div>
            </Panel>
            <Panel title="Review decision">
              <Button
                className="button--full"
                icon={CheckCircle2}
                onClick={() => navigate("edit-complaint")}
              >
                Confirm as valid
              </Button>
              <Button
                variant="danger-soft"
                className="button--full"
                icon={ShieldAlert}
                onClick={() => navigate("point-degradation")}
              >
                Apply point penalty
              </Button>
            </Panel>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function PointDegradation({ navigate, showToast }) {
  const [confirmed, setConfirmed] = React.useState(false);
  return (
    <Shell screen="admin-dashboard" navigate={navigate}>
      <div className="confirmation-stage">
        <div className="confirmation-glow" />
        <Panel className="penalty-card">
          <span className="penalty-card__icon">
            <ShieldAlert size={30} />
          </span>
          <Badge tone="red">ADMIN CONFIRMATION</Badge>
          <h1>Confirm point degradation</h1>
          <p>
            Apply a trust-point deduction only after the complaint has been
            reviewed and confirmed as invalid.
          </p>
          <div className="penalty-reference">
            <span>
              <FileText size={19} />
              <span>
                <small>COMPLAINT</small>
                <strong>CC-24091 · Overflowing waste beside market</strong>
              </span>
            </span>
            <Badge tone="gold">INVALID REPORT</Badge>
          </div>
          <div className="point-calculation">
            <div>
              <small>Current trust points</small>
              <strong>86</strong>
            </div>
            <span>
              <strong>−10</strong>
              <small>Point deduction</small>
            </span>
            <div>
              <small>New trust points</small>
              <strong>76</strong>
            </div>
          </div>
          <div className="rule-card">
            <Flag size={19} />
            <span>
              <strong>Rule PD-02 · Invalid information</strong>
              <small>
                Evidence did not match the tagged location after administrative
                review.
              </small>
            </span>
          </div>
          <label className="appeal-check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={() => setConfirmed(!confirmed)}
            />
            <span>
              <strong>Appeal protection acknowledged</strong>
              <small>
                The citizen can request a review of this decision from the
                complaint-details page.
              </small>
            </span>
          </label>
          <div className="penalty-actions">
            <Button
              variant="ghost"
              icon={Undo2}
              onClick={() => navigate("validity-review")}
            >
              Return to review
            </Button>
            <Button
              variant="danger"
              icon={ShieldAlert}
              disabled={!confirmed}
              onClick={() => {
                showToast("Point deduction confirmed in demo mode");
                navigate("validity-review");
              }}
            >
              Confirm point penalty
            </Button>
          </div>
          <small className="penalty-footnote">
            <Shield size={14} /> This action will be saved with the
            administrator, reason and timestamp.
          </small>
        </Panel>
      </div>
    </Shell>
  );
}

function Info({ label, value }) {
  return (
    <div className="info-item">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}
