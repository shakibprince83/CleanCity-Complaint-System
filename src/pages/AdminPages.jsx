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
  Field,
  PageHeading,
  Panel,
  SearchBox,
  StatCard,
  StatusBadge,
  Tick,
  TrustRing,
} from "../components/Common";

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

export function AdminDashboard({ navigate, complaints }) {
  return (
    <Shell screen="admin-dashboard" navigate={navigate}>
      <PageHeading
        eyebrow="CITY OPERATIONS"
        title="Admin dashboard"
        description="Review complaint activity and direct the response from one workspace."
        actions={
          <>
            <Button variant="outline" icon={RefreshCw}>
              Refresh
            </Button>
            <Button
              icon={FileText}
              onClick={() => navigate("manage-complaints")}
            >
              Manage complaints
            </Button>
          </>
        }
      />
      <div className="stats-grid">
        <StatCard
          label="Total complaints"
          value="248"
          note="+18 this week"
          icon={FileText}
          selected
        />
        <StatCard
          label="Pending review"
          value="27"
          note="11 high priority"
          icon={Clock}
          tone="gold"
        />
        <StatCard
          label="In progress"
          value="64"
          note="8 response teams active"
          icon={Activity}
          tone="blue"
        />
        <StatCard
          label="Resolved"
          value="157"
          note="63.3% resolution rate"
          icon={CheckCircle2}
          tone="green"
        />
      </div>
      <div className="admin-dashboard-grid">
        <Panel
          title="Complaint activity"
          action={
            <select className="panel-select">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          }
          className="span-2 chart-panel"
        >
          <div className="admin-bars">
            {[42, 58, 50, 77, 68, 91, 72].map((value, index) => (
              <div key={index}>
                <span style={{ height: `${value}%` }}>
                  <i>{value}</i>
                </span>
                <small>
                  {["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"][index]}
                </small>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span>
              <i className="legend-green" />
              Submitted complaints
            </span>
            <strong>
              +14.8% <small>from last week</small>
            </strong>
          </div>
        </Panel>
        <Panel title="Status overview" className="status-overview">
          <div
            className="donut"
            style={{ "--resolved": "63%", "--progress": "26%" }}
          >
            <div>
              <strong>248</strong>
              <small>Total</small>
            </div>
          </div>
          <div className="donut-legend">
            <span>
              <i className="green" />
              Resolved <strong>157</strong>
            </span>
            <span>
              <i className="blue" />
              In progress <strong>64</strong>
            </span>
            <span>
              <i className="gold" />
              Pending <strong>27</strong>
            </span>
          </div>
        </Panel>
        <Panel
          title="Requires attention"
          action={<Badge tone="red">11 URGENT</Badge>}
          className="span-2"
        >
          <div className="attention-list">
            {complaints
              .filter((item) => ["Urgent", "High"].includes(item.priority))
              .slice(0, 4)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate("edit-complaint")}
                >
                  <span
                    className={`priority-marker priority-marker--${item.priority.toLowerCase()}`}
                  >
                    <Flag size={17} />
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.id} · {item.location}
                    </small>
                  </span>
                  <StatusBadge status={item.priority} />
                  <ChevronRight size={17} />
                </button>
              ))}
          </div>
        </Panel>
        <Panel className="review-queue-card">
          <span className="review-queue-card__icon">
            <ClipboardCheck size={25} />
          </span>
          <Badge tone="gold">7 WAITING</Badge>
          <h3>Validity review queue</h3>
          <p>Verify evidence and reporter information before assignment.</p>
          <Button variant="light" onClick={() => navigate("validity-review")}>
            Start reviewing <ArrowRight size={16} />
          </Button>
        </Panel>
      </div>
    </Shell>
  );
}

export function ManageComplaints({ navigate, complaints }) {
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
        actions={<Button icon={Plus}>Add complaint</Button>}
      />
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
              {filtered.map((item) => (
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
                        onClick={() => navigate("edit-complaint")}
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
            <button>2</button>
            <button>3</button>
            <button>Next</button>
          </div>
        </div>
      </Panel>
    </Shell>
  );
}

export function EditComplaint({ navigate, complaint, showToast }) {
  const [status, setStatus] = React.useState(complaint.status);
  const [priority, setPriority] = React.useState(complaint.priority);
  const save = () =>
    showToast("Complaint changes saved for the UI demonstration");
  return (
    <Shell screen="manage-complaints" navigate={navigate}>
      <PageHeading
        eyebrow={`EDITING ${complaint.id}`}
        title="Review and update complaint"
        description={complaint.title}
        actions={
          <Button
            variant="outline"
            icon={ShieldAlert}
            onClick={() => navigate("report-authority")}
          >
            Report to authority
          </Button>
        }
      />
      <div className="edit-layout">
        <div className="edit-main">
          <Panel title="Complaint information">
            <div className="summary-banner">
              <span className="summary-banner__icon">
                <FileText size={23} />
              </span>
              <div>
                <Badge tone="green">{complaint.category}</Badge>
                <h3>{complaint.title}</h3>
                <p>{complaint.description}</p>
              </div>
            </div>
            <div className="info-grid info-grid--four">
              <Info label="Reporter" value="Demo Citizen" />
              <Info label="Submitted" value="08 Sep, 09:42 AM" />
              <Info label="Location" value="Demo Zone A, Ward 01" />
              <Info label="Verification" value="Passed" />
            </div>
          </Panel>
          <Panel title="Administrative notes">
            <Field
              label="Internal notes"
              hint="Visible only to administrators and assigned service officers."
            >
              <textarea
                rows="7"
                defaultValue="Initial evidence is clear. Location is inside the service boundary. Assign to the North Zone team for field inspection."
              />
            </Field>
          </Panel>
          <Panel title="Activity history">
            <div className="admin-history">
              <span>
                <i>
                  <Check size={13} />
                </i>
                <div>
                  <strong>Complaint passed initial review</strong>
                  <small>Demo Administrator · 08 Sep, 11:10 AM</small>
                </div>
              </span>
              <span>
                <i>
                  <UserCheck size={13} />
                </i>
                <div>
                  <strong>Assigned to North Zone response team</strong>
                  <small>System Admin · 08 Sep, 03:25 PM</small>
                </div>
              </span>
            </div>
          </Panel>
        </div>
        <div className="edit-sidebar">
          <Panel title="Update workflow">
            <Field label="Complaint status">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option>Pending</option>
                <option>Under Review</option>
                <option>Assigned</option>
                <option>In Progress</option>
                <option>Resolved</option>
              </select>
            </Field>
            <Field label="Priority level">
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
              >
                <option>Normal</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </Field>
            <Field label="Assign staff or team">
              <select defaultValue="North Zone Team A">
                <option>North Zone Team A</option>
                <option>North Zone Team B</option>
                <option>Central Response Team</option>
              </select>
            </Field>
            <div className="assignee-card">
              <span>NT</span>
              <div>
                <strong>North Zone Team A</strong>
                <small>4 active staff · 7 open tasks</small>
              </div>
              <strong className="availability-text">AVAILABLE</strong>
            </div>
          </Panel>
          <Panel className="save-panel">
            <div>
              <ShieldCheck size={20} />
              <span>
                <strong>Changes are ready</strong>
                <small>The citizen will receive a status notification.</small>
              </span>
            </div>
            <div>
              <Button
                variant="ghost"
                onClick={() => navigate("manage-complaints")}
              >
                Cancel
              </Button>
              <Button icon={Save} onClick={save}>
                Save changes
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}

export function UserManagement({ navigate, users }) {
  const [query, setQuery] = React.useState("");
  const filtered = users.filter((item) =>
    `${item.name} ${item.contact} ${item.type}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <Shell screen="user-management" navigate={navigate}>
      <PageHeading
        eyebrow="ACCESS CONTROL"
        title="User management"
        description="Review registered citizens and service officers."
        actions={<Button icon={Plus}>Add user</Button>}
      />
      <div className="user-stats">
        <article>
          <Users size={20} />
          <span>
            <strong>2,486</strong>
            <small>Total users</small>
          </span>
        </article>
        <article>
          <UserCheck size={20} />
          <span>
            <strong>2,402</strong>
            <small>Active accounts</small>
          </span>
        </article>
        <article>
          <BadgeCheck size={20} />
          <span>
            <strong>2,311</strong>
            <small>NID verified</small>
          </span>
        </article>
        <article>
          <Briefcase size={20} />
          <span>
            <strong>38</strong>
            <small>Service officers</small>
          </span>
        </article>
      </div>
      <Panel className="table-panel">
        <div className="toolbar toolbar--admin">
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search users"
          />
          <label className="select-control">
            <Users size={17} />
            <select>
              <option>All user types</option>
              <option>Citizen</option>
              <option>Service Officer</option>
            </select>
          </label>
          <label className="select-control">
            <Shield size={17} />
            <select>
              <option>All statuses</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </label>
          <Button variant="outline">Apply filters</Button>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email or phone</th>
                <th>Type</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <tr key={item.id}>
                  <td>
                    <span className="user-cell">
                      <i>
                        {item.name
                          .split(" ")
                          .map((x) => x[0])
                          .join("")}
                      </i>
                      <span>
                        <strong>{item.name}</strong>
                        <small>
                          {item.id}
                          {item.verified && " · NID verified"}
                        </small>
                      </span>
                    </span>
                  </td>
                  <td>{item.contact}</td>
                  <td>
                    <Badge tone={item.type === "Citizen" ? "blue" : "violet"}>
                      {item.type}
                    </Badge>
                  </td>
                  <td>{item.joined}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td>
                    <div className="table-actions">
                      <Button
                        variant="small"
                        onClick={() => navigate("edit-user")}
                      >
                        Edit
                      </Button>
                      <button className="danger">
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </Shell>
  );
}

export function EditUser({ navigate, user, showToast }) {
  return (
    <Shell screen="user-management" navigate={navigate}>
      <PageHeading
        eyebrow={`USER ${user.id}`}
        title="Edit user"
        description="Update identity, verification and account preferences."
        actions={<StatusBadge status={user.status} />}
      />
      <div className="edit-layout">
        <div className="edit-main">
          <Panel title="Profile information">
            <div className="edit-profile-head">
              <span>
                NR
                <i>
                  <BadgeCheck size={16} />
                </i>
              </span>
              <div>
                <h3>{user.name}</h3>
                <p>
                  {user.type} · Member since {user.joined}
                </p>
              </div>
              <Button variant="outline">Change photo</Button>
            </div>
            <div className="form-grid form-grid--two">
              <Field label="Full name">
                <input defaultValue={user.name} />
              </Field>
              <Field label="Email address">
                <input defaultValue="citizen@example.test" />
              </Field>
              <Field label="Phone number">
                <input defaultValue="+880 1XXX XXXXXX" />
              </Field>
              <Field label="Home area">
                <input defaultValue="Demo Zone A, Ward 01" />
              </Field>
            </div>
          </Panel>
          <Panel title="Account settings">
            <div className="form-grid form-grid--two">
              <Field label="User type">
                <select defaultValue="Citizen">
                  <option>Citizen</option>
                  <option>Service Officer</option>
                  <option>Admin</option>
                </select>
              </Field>
              <Field label="Account status">
                <select defaultValue="Active">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </Field>
              <Field label="Preferred language">
                <select>
                  <option>English</option>
                  <option>বাংলা</option>
                </select>
              </Field>
              <Field label="Notification preference">
                <select>
                  <option>All updates</option>
                  <option>Important only</option>
                  <option>Disabled</option>
                </select>
              </Field>
            </div>
          </Panel>
        </div>
        <div className="edit-sidebar">
          <Panel title="Identity verification">
            <div className="verification-profile">
              <span>
                <BadgeCheck size={27} />
              </span>
              <h3>NID verified</h3>
              <p>DEMO •••• 0001</p>
              <strong className="verification-date">
                VERIFIED 19 AUG 2026
              </strong>
            </div>
            <Button
              variant="outline"
              className="button--full"
              onClick={() => navigate("verification-review")}
            >
              Review verification
            </Button>
          </Panel>
          <Panel title="Security">
            <div className="security-list">
              <span>
                <small>Last login</small>
                <strong>Today, 08:42 AM</strong>
              </span>
              <span>
                <small>Account created</small>
                <strong>19 Aug 2026</strong>
              </span>
            </div>
            <Button
              variant="outline"
              icon={Mail}
              className="button--full"
              onClick={() => showToast("Password-reset email queued")}
            >
              Send password reset
            </Button>
          </Panel>
          <Panel className="danger-panel">
            <h3>
              <Trash2 size={18} /> Delete user
            </h3>
            <p>Permanently remove this account and restrict future access.</p>
            <Button variant="danger">Delete user</Button>
          </Panel>
          <div className="sticky-actions">
            <Button variant="ghost" onClick={() => navigate("user-management")}>
              Cancel
            </Button>
            <Button icon={Save} onClick={() => showToast("User changes saved")}>
              Save user
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

export function AdminProfile({ navigate, showToast }) {
  const [editing, setEditing] = React.useState(false);
  const [profile, setProfile] = React.useState({
    name: "Demo Administrator",
    email: "admin@example.test",
    phone: "+880 1XXX XXXXXX",
    department: "City Operations",
    role: "System Administrator",
  });
  const update = (key) => (event) =>
    setProfile((current) => ({ ...current, [key]: event.target.value }));
  const save = () => {
    setEditing(false);
    showToast("Administrator profile updated");
  };
  return (
    <Shell screen="admin-profile" navigate={navigate}>
      <PageHeading
        eyebrow="ADMINISTRATOR ACCOUNT"
        title="My profile"
        description="View and update your administrator information."
        actions={
          editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button icon={Save} onClick={save}>
                Save changes
              </Button>
            </>
          ) : (
            <Button icon={PenLine} onClick={() => setEditing(true)}>
              Edit profile
            </Button>
          )
        }
      />
      <div className="profile-layout admin-profile-layout">
        <Panel className="profile-identity admin-profile-identity">
          <div className="profile-avatar">
            DA
            <span>
              <ShieldCheck size={18} />
            </span>
          </div>
          <h2>{profile.name}</h2>
          <Badge tone="green">ACTIVE ADMIN</Badge>
          <p>{profile.role}</p>
          <div className="profile-contact">
            <span>
              <Mail size={17} />
              {profile.email}
            </span>
            <span>
              <User size={17} />
              {profile.department}
            </span>
            <span>
              <Shield size={17} />
              Full administrative access
            </span>
          </div>
        </Panel>
        <div className="profile-main">
          <Panel title="Administrator information">
            <div className="form-grid form-grid--two">
              <Field label="Full name">
                <input
                  value={profile.name}
                  onChange={update("name")}
                  disabled={!editing}
                />
              </Field>
              <Field label="Email address">
                <input
                  value={profile.email}
                  onChange={update("email")}
                  disabled={!editing}
                />
              </Field>
              <Field label="Phone number">
                <input
                  value={profile.phone}
                  onChange={update("phone")}
                  disabled={!editing}
                />
              </Field>
              <Field label="Department">
                <input
                  value={profile.department}
                  onChange={update("department")}
                  disabled={!editing}
                />
              </Field>
              <Field label="Administrator role">
                <input
                  value={profile.role}
                  onChange={update("role")}
                  disabled={!editing}
                />
              </Field>
              <Field label="Account status">
                <input value="Active" disabled />
              </Field>
            </div>
          </Panel>
          <Panel title="Account security">
            <div className="security-list">
              <span>
                <small>Last login</small>
                <strong>Today, 08:42 AM</strong>
              </span>
              <span>
                <small>Account created</small>
                <strong>19 Aug 2026</strong>
              </span>
              <span>
                <small>Access level</small>
                <strong>Full administrator</strong>
              </span>
            </div>
            <Button
              variant="outline"
              icon={Shield}
              onClick={() => showToast("Security settings opened")}
            >
              Manage security
            </Button>
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
