// Citizen portal pages for reporting, tracking and managing complaints.
import React from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock,
  Copy,
  Droplets,
  Edit3,
  FileText,
  Filter,
  Flag,
  ImagePlus,
  LocateFixed,
  Mail,
  MapPin,
  MessageSquareText,
  Navigation,
  Phone,
  Plus,
  Recycle,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  Sparkles,
  Upload,
  User,
  Waves,
  Wrench,
} from "lucide-react";
import {
  AppShell,
  Badge,
  Button,
  EmptyState,
  Field,
  MapSnapshot,
  PageHeading,
  Panel,
  SearchBox,
  StatCard,
  StatusBadge,
  Tick,
  TrustRing,
} from "../components/Common";
import LeafletMap from "../components/LeafletMap";
import { statusSteps } from "../data";

const Shell = ({ screen, navigate, children }) => (
  <AppShell
    active={screen}
    navigate={navigate}
    onPreview={() => navigate("preview")}
  >
    {children}
  </AppShell>
);

export function CitizenDashboard({ navigate, complaints }) {
  const recent = complaints.slice(0, 4);
  return (
    <Shell screen="citizen-dashboard" navigate={navigate}>
      <PageHeading
        eyebrow="CITIZEN OVERVIEW"
        title="Good morning, Demo Citizen"
        description="Track your reports and see how your neighbourhood is improving."
        actions={
          <Button icon={Plus} onClick={() => navigate("submit-complaint")}>
            New complaint
          </Button>
        }
      />

      <div className="stats-grid">
        <StatCard
          label="Total complaints"
          value="12"
          note="3 added this month"
          icon={FileText}
          selected
        />
        <StatCard
          label="In progress"
          value="03"
          note="Response teams active"
          icon={Wrench}
          tone="blue"
        />
        <StatCard
          label="Resolved"
          value="08"
          note="67% resolution rate"
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard
          label="Pending review"
          value="01"
          note="Usually reviewed in 2 hours"
          icon={Clock}
          tone="gold"
        />
      </div>

      <div className="dashboard-grid dashboard-grid--citizen">
        <Panel
          title="Recent complaints"
          action={
            <Button variant="text" onClick={() => navigate("my-complaints")}>
              View all <ArrowRight size={15} />
            </Button>
          }
          className="span-2"
        >
          <div className="complaint-list">
            {recent.map((item) => (
              <button
                key={item.id}
                className="complaint-row"
                onClick={() => navigate("complaint-details")}
              >
                <span
                  className={`category-icon category-icon--${item.category.toLowerCase()}`}
                >
                  {item.category === "Waste" ? (
                    <Recycle size={19} />
                  ) : item.category === "Waterlogging" ? (
                    <Droplets size={19} />
                  ) : (
                    <Siren size={19} />
                  )}
                </span>
                <span className="complaint-row__main">
                  <strong>{item.title}</strong>
                  <small>
                    <span>{item.id}</span>
                    <MapPin size={13} />
                    {item.location}
                  </small>
                </span>
                <StatusBadge status={item.status} />
                <ChevronRight size={18} />
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Neighbourhood impact" className="impact-panel">
          <div className="impact-score">
            <TrustRing value={78} label="cleaner" />
            <div>
              <Badge tone="green">+12% THIS MONTH</Badge>
              <h3>Your reports matter</h3>
              <p>
                Eight verified issues around your area were resolved this month.
              </p>
            </div>
          </div>
          <div className="micro-bars">
            {[38, 52, 44, 73, 58, 84, 69].map((height, index) => (
              <i key={index} style={{ height: `${height}%` }}>
                <span>{["S", "M", "T", "W", "T", "F", "S"][index]}</span>
              </i>
            ))}
          </div>
        </Panel>

        <Panel title="Service area" className="zone-panel">
          <MapSnapshot compact />
          <div className="zone-panel__bottom">
            <span>
              <ShieldCheck size={17} /> Home area is covered
            </span>
            <button onClick={() => navigate("location")}>Check location</button>
          </div>
        </Panel>

        <Panel className="action-panel action-panel--emerald">
          <span className="action-panel__icon">
            <Sparkles size={24} />
          </span>
          <div>
            <small>QUICK ACTION</small>
            <h3>Notice a civic issue?</h3>
            <p>Send the location and a photo in a few simple steps.</p>
          </div>
          <Button variant="light" onClick={() => navigate("submit-complaint")}>
            Report now <ArrowRight size={16} />
          </Button>
        </Panel>
      </div>
    </Shell>
  );
}

export function SubmitComplaint({
  navigate,
  location,
  addComplaint,
  showToast,
}) {
  const [category, setCategory] = React.useState("Waste");
  const [equipment, setEquipment] = React.useState(false);
  const [preview, setPreview] = React.useState(null);
  const [title, setTitle] = React.useState(
    "Overflowing waste beside the local market",
  );
  const [description, setDescription] = React.useState(
    "Waste has remained beside the public market and is blocking the pedestrian path.",
  );

  const upload = (event) => {
    const file = event.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };
  const submit = (event) => {
    event.preventDefault();
    addComplaint({
      title,
      description,
      category,
      location: "Demo Road A, Ward 01",
    });
    showToast("Complaint submitted. ID CC-24102 has been created.");
    navigate("submission-confirmation");
  };

  const categories = [
    ["Waste", Recycle, "Garbage, bins or street waste"],
    ["Waterlogging", Waves, "Standing water or blocked drainage"],
    ["Emergency", Siren, "Urgent civic or public safety issue"],
  ];

  return (
    <Shell screen="submit-complaint" navigate={navigate}>
      <PageHeading
        eyebrow="NEW REPORT"
        title="Submit a complaint"
        description="Share clear evidence and an exact location for a faster response."
        actions={
          <Badge tone="green">
            <BadgeCheck size={15} /> CITIZEN VERIFIED
          </Badge>
        }
      />
      <form className="complaint-form" onSubmit={submit}>
        <Panel title="1. What happened?" className="form-section span-2">
          <div className="category-grid">
            {categories.map(([name, Icon, text]) => (
              <button
                type="button"
                key={name}
                className={category === name ? "selected" : ""}
                onClick={() => setCategory(name)}
              >
                <span>
                  <Icon size={22} />
                </span>
                <strong>{name}</strong>
                <small>{text}</small>
                <i>{category === name && <Check size={14} />}</i>
              </button>
            ))}
          </div>
          <div className="form-grid form-grid--two">
            <Field label="Short title">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </Field>
            <Field label="Issue category">
              <div className="read-only-field">
                <span
                  className={`category-dot category-dot--${category.toLowerCase()}`}
                />
                {category}
                <Badge tone="glass">Selected</Badge>
              </div>
            </Field>
          </div>
          <Field
            label="Complaint description"
            hint={`${description.length}/500 characters`}
          >
            <textarea
              rows="5"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </Field>

          {category === "Emergency" && (
            <div className="emergency-box">
              <div>
                <span>
                  <ShieldAlert size={20} />
                </span>
                <div>
                  <strong>Emergency reporting details</strong>
                  <small>
                    Provide authority information when reporting on behalf of a
                    public service.
                  </small>
                </div>
              </div>
              <div className="form-grid form-grid--two">
                <Field label="Reporter authority">
                  <select defaultValue="Police">
                    <option>Police</option>
                    <option>Fire Service</option>
                    <option>City Corporation</option>
                  </select>
                </Field>
                <Field label="Officer or service ID">
                  <input defaultValue="DMP-02841" />
                </Field>
              </div>
              <label className="toggle-row">
                <span>
                  <strong>Emergency equipment required</strong>
                  <small>
                    Request specialised equipment with the response team.
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={equipment}
                  onChange={() => setEquipment(!equipment)}
                />
                <i />
              </label>
            </div>
          )}
        </Panel>

        <Panel title="2. Add clear evidence" className="form-section">
          <label
            className={`upload-box ${preview ? "upload-box--filled" : ""}`}
          >
            {preview ? (
              <img src={preview} alt="Selected complaint preview" />
            ) : (
              <>
                <span>
                  <ImagePlus size={29} />
                </span>
                <strong>Add complaint photos</strong>
                <small>PNG or JPG, up to 8 MB</small>
              </>
            )}
            <input type="file" accept="image/*" onChange={upload} />
          </label>
          <div className="tip-row">
            <Camera size={17} />
            <span>
              Use a wide, well-lit image that clearly shows the issue.
            </span>
          </div>
        </Panel>

        <Panel title="3. Confirm the location" className="form-section">
          <MapSnapshot compact />
          <div className="location-summary">
            <div>
              <MapPin size={18} />
              <span>
                <strong>Demo Road A</strong>
                <small>Ward 01, Demo Zone</small>
              </span>
            </div>
            <Badge tone="green">WITHIN 5 KM</Badge>
          </div>
          <Button
            type="button"
            variant="outline"
            icon={LocateFixed}
            className="button--full"
            onClick={() => navigate("location")}
          >
            Tag location on map
          </Button>
        </Panel>

        <div className="submit-bar span-2">
          <span>
            <ShieldCheck size={19} />
            <span>
              <strong>Ready to submit</strong>
              <small>
                Your identity is verified and the selected location is covered.
              </small>
            </span>
          </span>
          <div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("citizen-dashboard")}
            >
              Save for later
            </Button>
            <Button type="submit" icon={Navigation}>
              Submit complaint
            </Button>
          </div>
        </div>
      </form>
    </Shell>
  );
}

export function LocationSelection({
  navigate,
  location,
  setLocation,
  showToast,
}) {
  const [address, setAddress] = React.useState("Demo Road A, Ward 01");
  const confirm = () => {
    showToast("Location confirmed inside the 5 km service area");
    navigate("submit-complaint");
  };
  return (
    <Shell screen="submit-complaint" navigate={navigate}>
      <PageHeading
        eyebrow="LOCATION TAGGING"
        title="Select the exact location"
        description="Use GPS, move the marker or enter the address manually."
        actions={
          <Badge tone="green">
            <ShieldCheck size={15} /> SERVICE AREA ACTIVE
          </Badge>
        }
      />
      <div className="location-layout">
        <Panel className="location-map-panel">
          <LeafletMap value={location} onChange={setLocation} />
        </Panel>
        <Panel title="Location details" className="location-details">
          <div className="coordinate-card">
            <span>
              <LocateFixed size={20} />
            </span>
            <div>
              <small>SELECTED COORDINATES</small>
              <strong>
                {location[0]}, {location[1]}
              </strong>
            </div>
            <strong className="gps-ready-text">GPS READY</strong>
          </div>
          <Field label="Address">
            <div className="input-wrap">
              <MapPin size={17} />
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
            </div>
          </Field>
          <div className="form-grid form-grid--two">
            <Field label="Area or ward">
              <select defaultValue="Ward 19">
                <option>Ward 19</option>
                <option>Ward 20</option>
                <option>Ward 18</option>
              </select>
            </Field>
            <Field label="Nearby landmark">
              <input defaultValue="Demo Community Centre" />
            </Field>
          </div>
          <div className="eligibility-card">
            <div>
              <CheckCircle2 size={21} />
              <span>
                <strong>Location is eligible</strong>
                <small>1.8 km from the nearest response point</small>
              </span>
            </div>
            <div className="eligibility-meter">
              <i style={{ width: "36%" }} />
            </div>
            <small>5 km service radius</small>
          </div>
          <div className="location-actions">
            <Button
              variant="ghost"
              onClick={() => navigate("submit-complaint")}
            >
              Cancel
            </Button>
            <Button icon={CheckCircle2} onClick={confirm}>
              Confirm location
            </Button>
          </div>
        </Panel>
      </div>
    </Shell>
  );
}

export function SubmissionConfirmation({ navigate, complaint, showToast }) {
  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(complaint.id);
      showToast("Complaint ID copied");
    } catch {
      showToast(`Complaint ID: ${complaint.id}`);
    }
  };

  return (
    <Shell screen="my-complaints" navigate={navigate}>
      <div className="success-stage">
        <div className="success-stage__glow" />
        <Panel className="success-card">
          <div className="success-mark">
            <Check size={34} />
            <i />
            <i />
          </div>
          <Badge tone="green">SUBMISSION COMPLETE</Badge>
          <h1>Your complaint is on its way.</h1>
          <p>
            The review team has received your report. Save the complaint ID to
            follow every update.
          </p>
          <button className="complaint-id-card" onClick={copyId}>
            <span>
              <small>YOUR COMPLAINT ID</small>
              <strong>{complaint.id}</strong>
            </span>
            <span>
              <Copy size={17} /> Copy ID
            </span>
          </button>
          <div className="success-summary">
            <span>
              <small>Category</small>
              <strong>{complaint.category}</strong>
            </span>
            <span>
              <small>Location</small>
              <strong>{complaint.location}</strong>
            </span>
            <span>
              <small>Initial status</small>
              <StatusBadge status="Pending" />
            </span>
          </div>
          <div className="next-step-card">
            <Clock size={20} />
            <span>
              <strong>What happens next?</strong>
              <small>
                An administrator normally reviews complete reports within two
                hours. You will receive an in-app notification.
              </small>
            </span>
          </div>
          <div className="success-actions">
            <Button
              variant="outline"
              className="confirmation-button confirmation-button--submit"
              onClick={() => navigate("submit-complaint")}
            >
              <span className="confirmation-button__label">Submit another</span>
            </Button>
            <Button
              className="confirmation-button confirmation-button--view"
              onClick={() => navigate("complaint-details")}
            >
              <span className="confirmation-button__label">View complaint</span>
              <ArrowRight size={16} />
            </Button>
          </div>
          <button
            className="dashboard-return"
            onClick={() => navigate("citizen-dashboard")}
          >
            Return to citizen dashboard
          </button>
        </Panel>
      </div>
    </Shell>
  );
}

export function MyComplaints({ navigate, complaints }) {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("All statuses");
  const filtered = complaints.filter((item) => {
    const text = `${item.id} ${item.title} ${item.location}`.toLowerCase();
    return (
      text.includes(query.toLowerCase()) &&
      (status === "All statuses" || item.status === status)
    );
  });
  return (
    <Shell screen="my-complaints" navigate={navigate}>
      <PageHeading
        eyebrow="REPORT HISTORY"
        title="My complaints"
        description="Search, filter and follow every complaint you have submitted."
        actions={
          <Button icon={Plus} onClick={() => navigate("submit-complaint")}>
            New complaint
          </Button>
        }
      />
      <Panel className="table-panel">
        <div className="toolbar">
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search by ID, issue or location"
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
          <span className="result-count">{filtered.length} complaints</span>
        </div>
        {filtered.length ? (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Complaint</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate("complaint-details")}
                  >
                    <td>
                      <span className="table-title">
                        <i
                          className={`category-icon category-icon--${item.category.toLowerCase()}`}
                        >
                          {item.category === "Waste" ? (
                            <Recycle size={17} />
                          ) : item.category === "Waterlogging" ? (
                            <Droplets size={17} />
                          ) : (
                            <Siren size={17} />
                          )}
                        </i>
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.id}</small>
                        </span>
                      </span>
                    </td>
                    <td>{item.category}</td>
                    <td>
                      <span className="location-cell">
                        <MapPin size={14} />
                        {item.location}
                      </span>
                    </td>
                    <td>{item.date}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <button className="row-action">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No complaints found"
            description="Try a different search or status filter."
          />
        )}
      </Panel>
    </Shell>
  );
}

export function ComplaintDetails({ navigate, complaint }) {
  const item = complaint;
  return (
    <Shell screen="my-complaints" navigate={navigate}>
      <PageHeading
        eyebrow={`COMPLAINT ${item.id}`}
        title={item.title}
        description="Submitted on 08 September 2026 at 09:42 AM"
        actions={
          <>
            <StatusBadge status={item.status} />
            <Button variant="outline" icon={MessageSquareText}>
              Contact support
            </Button>
          </>
        }
      />
      <div className="details-grid">
        <Panel className="span-2 evidence-card">
          <div className="complaint-photo">
            <div className="photo-overlay">
              <Badge tone="glass">
                <Camera size={14} /> SUBMITTED EVIDENCE
              </Badge>
              <span>Photo preview</span>
            </div>
            <Recycle size={78} />
          </div>
          <div className="evidence-copy">
            <div>
              <Badge tone="green">{item.category}</Badge>
              <Badge tone="gold">{item.priority} priority</Badge>
            </div>
            <h2>Complaint description</h2>
            <p>{item.description}</p>
            <div className="detail-meta">
              <span>
                <Clock size={16} />
                <small>Reported</small>
                <strong>08 Sep, 09:42 AM</strong>
              </span>
              <span>
                <User size={16} />
                <small>Reporter</small>
                <strong>Demo Citizen</strong>
              </span>
              <span>
                <BadgeCheck size={16} />
                <small>Verification</small>
                <strong>Citizen verified</strong>
              </span>
            </div>
          </div>
        </Panel>
        <Panel title="Status timeline" className="timeline-panel">
          <div className="timeline">
            {statusSteps.map(([label, time, complete], index) => (
              <div key={label} className={complete ? "complete" : ""}>
                <span>
                  {complete ? <Check size={14} /> : <Circle size={12} />}
                </span>
                <div>
                  <strong>{label}</strong>
                  <small>{time}</small>
                  {index === 3 && <Badge tone="blue">CURRENT</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Tagged location" className="location-card">
          <MapSnapshot compact />
          <div className="address-block">
            <MapPin size={18} />
            <span>
              <strong>{item.location}</strong>
              <small>23.780800, 90.407100</small>
            </span>
          </div>
          <Button
            variant="outline"
            className="button--full"
            onClick={() => navigate("location")}
          >
            Open interactive map
          </Button>
        </Panel>
        <Panel className="status-note">
          <span>
            <ShieldCheck size={22} />
          </span>
          <div>
            <strong>The response team is working on this issue</strong>
            <p>
              The assigned North Zone team checked in at 08:15 AM. You will
              receive a notification after completion.
            </p>
          </div>
        </Panel>
      </div>
    </Shell>
  );
}

export function ProfilePage({ navigate, complaints, showToast }) {
  return (
    <Shell screen="profile" navigate={navigate}>
      <PageHeading
        eyebrow="ACCOUNT"
        title="Profile"
        description="Manage your identity, contact information and service preferences."
        actions={
          <Button
            icon={Edit3}
            onClick={() => showToast("Profile edit mode opened")}
          >
            Edit profile
          </Button>
        }
      />
      <div className="profile-layout">
        <Panel className="profile-identity">
          <div className="profile-avatar">
            DC
            <span>
              <BadgeCheck size={18} />
            </span>
          </div>
          <h2>Demo Citizen</h2>
          <Badge tone="green">VERIFIED CITIZEN</Badge>
          <p>Member since 19 August 2026</p>
          <div className="profile-score">
            <TrustRing value={86} label="trust score" />
            <span>
              <strong>Excellent standing</strong>
              <small>12 verified reports</small>
            </span>
          </div>
          <div className="profile-contact">
            <span>
              <Mail size={17} />
              citizen@example.test
            </span>
            <span>
              <Phone size={17} />
              +880 1XXX XXXXXX
            </span>
            <span>
              <MapPin size={17} />
              Demo Zone A, Ward 01
            </span>
          </div>
        </Panel>
        <div className="profile-main">
          <Panel title="Account information">
            <div className="info-grid">
              <Info label="Full name" value="Demo Citizen" />
              <Info label="National ID" value="DEMO •••• 0001" />
              <Info label="Account status" value="Active" badge />
              <Info label="User type" value="Citizen" />
            </div>
          </Panel>
          <Panel title="Preferences">
            <div className="preference-list">
              <label>
                <span>
                  <strong>Preferred language</strong>
                  <small>Language used in system messages</small>
                </span>
                <select defaultValue="English">
                  <option>English</option>
                  <option>বাংলা</option>
                </select>
              </label>
              <label>
                <span>
                  <strong>Complaint notifications</strong>
                  <small>Receive status updates and service messages</small>
                </span>
                <input type="checkbox" defaultChecked />
                <i />
              </label>
            </div>
          </Panel>
          <Panel
            title="Complaint history"
            action={
              <Button variant="text" onClick={() => navigate("my-complaints")}>
                View all
              </Button>
            }
          >
            <div className="compact-list">
              {complaints.slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate("complaint-details")}
                >
                  <span>
                    <strong>{item.title}</strong>
                    <small>
                      {item.id} · {item.location}
                    </small>
                  </span>
                  <StatusBadge status={item.status} />
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </Shell>
  );
}

function Info({ label, value, badge }) {
  return (
    <div className="info-item">
      <small>{label}</small>
      <strong>{value}</strong>
      {badge && <Badge tone="green">ACTIVE</Badge>}
    </div>
  );
}

export function NotificationsPage({ navigate, notifications, markAllRead }) {
  const unread = notifications.filter((item) => item.unread).length;
  return (
    <Shell screen="notifications" navigate={navigate}>
      <PageHeading
        eyebrow="UPDATES"
        title="Notifications"
        description="Follow complaint activity and important service messages."
        actions={
          <Button variant="outline" icon={Check} onClick={markAllRead}>
            Mark all as read
          </Button>
        }
      />
      <div className="notification-layout">
        <Panel
          className="notification-list"
          title={`${unread} unread notifications`}
        >
          {notifications.map((item) => (
            <article
              key={item.id}
              className={`notification-item ${item.unread ? "notification-item--unread" : ""}`}
            >
              <span
                className={`notification-item__icon notification-item__icon--${item.tone}`}
              >
                {item.title.includes("Location") ? (
                  <MapPin size={19} />
                ) : item.title.includes("Review") ? (
                  <ClipboardCheck size={19} />
                ) : (
                  <Bell size={19} />
                )}
              </span>
              <div>
                <div>
                  <strong>{item.title}</strong>
                  {item.unread && <i />}
                </div>
                <p>{item.message}</p>
                <small>
                  <Clock size={13} />
                  {item.time}
                </small>
              </div>
              <button onClick={() => navigate("complaint-details")}>
                <ChevronRight size={18} />
              </button>
            </article>
          ))}
        </Panel>
        <Panel className="notification-summary">
          <div className="notification-orbit">
            <Bell size={30} />
            <i />
            <i />
          </div>
          <h2>Stay informed</h2>
          <p>
            CleanCity sends updates when a complaint is reviewed, assigned or
            resolved.
          </p>
          <div className="notification-types">
            <span>
              <Tick />
              Status changes
            </span>
            <span>
              <Tick />
              Review decisions
            </span>
            <span>
              <Tick />
              Service messages
            </span>
          </div>
        </Panel>
      </div>
    </Shell>
  );
}
