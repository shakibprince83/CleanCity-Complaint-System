// Reusable interface components shared by public, citizen and administrator pages.
import React from "react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  HelpCircle,
  Home,
  LayoutDashboard,
  Leaf,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  User,
  Users,
  X,
} from "lucide-react";
import { adminSidebar, citizenSidebar } from "../data";
import { useAuth } from "../context/AuthContext";
import { useCitizenData } from "../context/CitizenDataContext";
import { useAdminNotifications } from "../context/AdminNotificationContext";
import { supabase } from "../lib/supabase";

const iconMap = {
  "citizen-dashboard": LayoutDashboard,
  "submit-complaint": Plus,
  "my-complaints": ClipboardList,
  notifications: Bell,
  profile: User,
  "admin-dashboard": LayoutDashboard,
  "admin-profile": User,
  "manage-complaints": FileText,
  "user-management": Users,
  "report-authority": BarChart3,
};

export function Logo({ onClick, compact = false }) {
  return (
    <button
      className={`brand ${compact ? "brand--compact" : ""}`}
      onClick={onClick}
      aria-label="CleanCity home"
    >
      <span className="brand__mark">
        <Leaf size={22} strokeWidth={2.4} />
      </span>
      {!compact && (
        <span>
          <strong>Clean</strong>City
        </span>
      )}
    </button>
  );
}

export function Badge({ children, tone = "green" }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function StatusBadge({ status }) {
  const tone =
    {
      Resolved: "green",
      Active: "green",
      "In Progress": "blue",
      Assigned: "violet",
      "Under Review": "gold",
      Pending: "gold",
      Inactive: "gray",
      Urgent: "red",
      High: "orange",
      Medium: "gold",
      Normal: "green",
    }[status] || "gray";
  return (
    <Badge tone={tone}>
      <span className="badge__dot" />
      {status}
    </Badge>
  );
}

export function Button({
  children,
  variant = "primary",
  icon: Icon,
  className = "",
  ...props
}) {
  return (
    <button className={`button button--${variant} ${className}`} {...props}>
      {Icon && <Icon size={17} />}
      <span>{children}</span>
    </button>
  );
}

export function IconButton({ icon: Icon, label, className = "", ...props }) {
  return (
    <button
      className={`icon-button ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      <Icon size={19} />
    </button>
  );
}

export function ThemeToggle({ theme = "dark", onToggle }) {
  const isLight = theme === "light";
  const nextTheme = isLight ? "Dark" : "Light";
  const Icon = isLight ? Moon : Sun;

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${nextTheme.toLowerCase()} mode`}
      title={`Switch to ${nextTheme.toLowerCase()} mode`}
      aria-pressed={isLight}
    >
      <span className="theme-toggle__icon">
        <Icon size={18} />
      </span>
      <span>
        <strong>{nextTheme}</strong>
        <small>mode</small>
      </span>
    </button>
  );
}

export function PageHeading({ eyebrow, title, description, actions }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-heading__actions">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  note,
  icon: Icon = Activity,
  tone = "green",
  selected = false,
}) {
  return (
    <article
      className={`stat-card stat-card--${tone} ${selected ? "stat-card--selected" : ""}`}
    >
      <div className="stat-card__top">
        <span>{label}</span>
        <span className="stat-card__icon">
          <Icon size={18} />
        </span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder = "Search",
  onFocus,
}) {
  return (
    <label className="search-box">
      <Search size={18} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
      />
    </label>
  );
}

export function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`field ${className}`}>
      <span className="field__label">{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Panel({ children, className = "", title, action }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && (
        <div className="panel__header">
          <h2>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function SideNav({ type, active, navigate, open, close, onSignOut }) {
  const items = type === "admin" ? adminSidebar : citizenSidebar;
  const { complaints: citizenComplaints } = useCitizenData();
  const [adminComplaints, setAdminComplaints] = React.useState([]);

  React.useEffect(() => {
    let activeRequest = true;

    const loadAdminImpact = async () => {
      if (type !== "admin" || !supabase) {
        if (activeRequest) setAdminComplaints([]);
        return;
      }

      const { data, error } = await supabase
        .from("complaints")
        .select("id, status");

      if (!activeRequest) return;
      if (error) {
        console.error("Unable to load cleaner-city impact", error);
        setAdminComplaints([]);
        return;
      }
      setAdminComplaints(data || []);
    };

    loadAdminImpact();
    return () => {
      activeRequest = false;
    };
  }, [type, active]);

  const impactComplaints =
    type === "admin" ? adminComplaints : citizenComplaints;
  const resolvedCount = impactComplaints.filter(
    (item) => item.status === "Resolved",
  ).length;
  const resolutionRate = impactComplaints.length
    ? Math.round((resolvedCount / impactComplaints.length) * 100)
    : 0;
  return (
    <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
      <div className="sidebar__head">
        <Logo onClick={() => navigate("home")} />
        <IconButton
          icon={X}
          label="Close menu"
          className="sidebar__close"
          onClick={close}
        />
      </div>
      <div className="sidebar__caption">
        {type === "admin" ? "ADMINISTRATION" : "CITIZEN PORTAL"}
      </div>
      <nav className="sidebar__nav">
        {items.map(([id, label]) => {
          const Icon = iconMap[id] || Home;
          return (
            <button
              key={id}
              className={active === id ? "active" : ""}
              onClick={() => {
                navigate(id);
                close();
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar__bottom">
        <button>
          <Settings size={18} />
          Settings
        </button>
        <button>
          <HelpCircle size={18} />
          Help centre
        </button>
        <button onClick={onSignOut}>
          <LogOut size={18} />
          Sign out
        </button>
      </div>
      <div className="sidebar__eco">
        <span>
          <Leaf size={16} /> Cleaner city impact
        </span>
        <strong>{resolutionRate}%</strong>
        <div>
          <i style={{ width: `${resolutionRate}%` }} />
        </div>
        <small>{resolvedCount} resolved {resolvedCount === 1 ? "report" : "reports"}</small>
      </div>
    </aside>
  );
}

export function AppShell({
  type = "citizen",
  active,
  navigate,
  children,
  onPreview,
}) {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);
  const notificationRef = React.useRef(null);
  const searchRef = React.useRef(null);
  const {
    notifications: adminNotifications,
    unreadCount: adminUnreadCount,
    loading: adminNotificationsLoading,
    error: adminNotificationsError,
    markRead: markAdminNotificationRead,
    markAllRead: markAllAdminNotificationsRead,
  } = useAdminNotifications(type === "admin");
  const {
    complaints: citizenComplaints,
    notifications: citizenNotifications,
    loading: citizenNotificationsLoading,
    error: citizenNotificationsError,
    markNotificationRead,
    markAllRead: markAllCitizenNotificationsRead,
  } = useCitizenData();
  const citizenUnreadCount = citizenNotifications.filter(
    (item) => item.unread,
  ).length;
  const complaintSuggestions = React.useMemo(() => {
    if (type !== "citizen" || !searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    return citizenComplaints
      .filter((complaint) =>
        [
          complaint.id,
          complaint.title,
          complaint.category,
          complaint.location,
          complaint.description,
          complaint.status,
        ].some((value) => String(value || "").toLowerCase().includes(query)),
      )
      .slice(0, 5);
  }, [citizenComplaints, searchQuery, type]);
  const citizenName = profile?.full_name || user?.email || "Citizen";
  const adminName = profile?.full_name || user?.email || "Administrator";
  const activeName = type === "admin" ? adminName : citizenName;
  const citizenInitials = activeName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  React.useEffect(() => {
    if (!searchOpen) return undefined;

    const closeSearch = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", closeSearch);
    return () => document.removeEventListener("mousedown", closeSearch);
  }, [searchOpen]);

  React.useEffect(() => {
    if (!notificationsOpen) return undefined;

    const closeNotifications = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeNotifications);
    return () => document.removeEventListener("mousedown", closeNotifications);
  }, [notificationsOpen]);

  const openAdminNotification = async (notification) => {
    try {
      if (!notification.read) {
        await markAdminNotificationRead(notification.id);
      }
      setNotificationsOpen(false);

      if (notification.entityType === "complaint" && notification.entityId) {
        const complaintDestination =
          notification.actionType === "complaint_reviewed"
            ? "validity-review"
            : notification.actionType === "trust_penalty_applied"
              ? "point-degradation"
              : notification.actionType === "authority_report_created" ||
                  notification.actionType === "authority_report_updated"
                ? "report-authority"
                : "edit-complaint";

        navigate(complaintDestination, {
          adminComplaintId: notification.entityId,
        });
        return;
      }

      if (notification.entityType === "profile") {
        if (
          notification.actionType !== "account_deleted" &&
          notification.entityId
        ) {
          navigate("edit-user", { userId: notification.entityId });
        } else {
          navigate("user-management");
        }
        return;
      }

      navigate("admin-dashboard");
    } catch (notificationError) {
      console.error("Unable to open administrator notification", notificationError);
    }
  };

  const openCitizenNotification = async (notification) => {
    try {
      if (notification.unread) {
        await markNotificationRead(notification.id);
      }
      setNotificationsOpen(false);

      if (notification.complaintId) {
        navigate("complaint-details", {
          citizenComplaintId: notification.complaintId,
        });
      } else {
        navigate("citizen-dashboard");
      }
    } catch (notificationError) {
      console.error("Unable to open citizen notification", notificationError);
    }
  };

  const handleSignOut = async () => {
    if (type === "citizen" && user) {
      try {
        await signOut();
      } catch (error) {
        console.error("Unable to sign out", error);
      }
    }
    navigate("home");
  };

  return (
    <div className={`app-shell app-shell--${type} screen-${active}`}>
      <SideNav
        type={type}
        active={active}
        navigate={navigate}
        open={open}
        close={() => setOpen(false)}
        onSignOut={handleSignOut}
      />
      {open && (
        <button
          className="sidebar-backdrop"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <main className="workspace">
        <header className="topbar">
          <IconButton
            icon={Menu}
            label="Open menu"
            className="topbar__menu"
            onClick={() => setOpen(true)}
          />
          <div className="topbar-search" ref={searchRef}>
            <SearchBox
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                setSearchOpen(Boolean(value.trim()));
              }}
              onFocus={() => setSearchOpen(Boolean(searchQuery.trim()))}
              placeholder={
                type === "admin"
                  ? "Search complaints, users or reports"
                  : "Search your complaints"
              }
            />
            {type === "citizen" && searchOpen && searchQuery.trim() && (
              <section className="search-suggestions" aria-label="Complaint search suggestions">
                <header className="search-suggestions__header">
                  <span>
                    <strong>Complaint suggestions</strong>
                    <small>Search results from your reports</small>
                  </span>
                  <em>{complaintSuggestions.length}/5</em>
                </header>
                <div className="search-suggestions__list">
                  {complaintSuggestions.length ? (
                    complaintSuggestions.map((complaint) => (
                      <button
                        type="button"
                        key={complaint.databaseId}
                        onClick={() => {
                          setSearchQuery(complaint.title);
                          setSearchOpen(false);
                          navigate("complaint-details", {
                            citizenComplaintId: complaint.databaseId,
                          });
                        }}
                      >
                        <span className="search-suggestions__icon">
                          <FileText size={17} />
                        </span>
                        <span className="search-suggestions__content">
                          <span className="search-suggestions__title">
                            <strong>{complaint.title}</strong>
                            <em>{complaint.status}</em>
                          </span>
                          <small>
                            {complaint.id} · {complaint.category}
                          </small>
                          <small className="search-suggestions__location">
                            <MapPin size={12} /> {complaint.location}
                          </small>
                        </span>
                        <span className="search-suggestions__arrow">
                          <ChevronRight size={16} />
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="search-suggestions__empty">
                      <Search size={20} />
                      <span>
                        <strong>No complaint found</strong>
                        <small>Try a title, complaint ID, category or location.</small>
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
          <div className="topbar__actions">
            {type === "admin" ? (
              <div className="admin-notification-menu" ref={notificationRef}>
                <IconButton
                  icon={Bell}
                  label="Administrator notifications"
                  className={adminUnreadCount ? "icon-button--unread" : ""}
                  aria-expanded={notificationsOpen}
                  onClick={() => setNotificationsOpen((current) => !current)}
                />
                {adminUnreadCount > 0 && (
                  <span className="admin-notification-count">
                    {adminUnreadCount > 99 ? "99+" : adminUnreadCount}
                  </span>
                )}
                {notificationsOpen && (
                  <section
                    className="admin-notification-popover"
                    aria-label="Administrator notifications"
                  >
                    <header>
                      <span>
                        <strong>Notifications</strong>
                        <small>{adminUnreadCount} unread</small>
                      </span>
                      {adminUnreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markAllAdminNotificationsRead()}
                        >
                          Mark all as read
                        </button>
                      )}
                    </header>
                    <div className="admin-notification-list">
                      {adminNotificationsLoading ? (
                        <p className="admin-notification-state">
                          Loading notifications…
                        </p>
                      ) : adminNotificationsError ? (
                        <p className="admin-notification-state admin-notification-state--error">
                          {adminNotificationsError}
                        </p>
                      ) : adminNotifications.length ? (
                        adminNotifications.map((notification) => (
                          <button
                            type="button"
                            key={notification.id}
                            className={`admin-notification-item ${notification.read ? "admin-notification-item--read" : ""}`}
                            onClick={() => openAdminNotification(notification)}
                          >
                            <span
                              className={`admin-notification-item__dot admin-notification-item__dot--${notification.tone}`}
                            />
                            <span>
                              <strong>{notification.title}</strong>
                              <small>{notification.message}</small>
                              <time>
                                {new Intl.DateTimeFormat("en-GB", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }).format(new Date(notification.createdAt))}
                              </time>
                            </span>
                            <ChevronRight size={16} />
                          </button>
                        ))
                      ) : (
                        <p className="admin-notification-state">
                          No administrator activity yet.
                        </p>
                      )}
                    </div>
                  </section>
                )}
              </div>
            ) : (
              <div className="admin-notification-menu" ref={notificationRef}>
                <IconButton
                  icon={Bell}
                  label="Citizen notifications"
                  className={citizenUnreadCount ? "icon-button--unread" : ""}
                  aria-expanded={notificationsOpen}
                  onClick={() => setNotificationsOpen((current) => !current)}
                />
                {citizenUnreadCount > 0 && (
                  <span className="admin-notification-count">
                    {citizenUnreadCount > 99 ? "99+" : citizenUnreadCount}
                  </span>
                )}
                {notificationsOpen && (
                  <section
                    className="admin-notification-popover"
                    aria-label="Citizen notifications"
                  >
                    <header>
                      <span>
                        <strong>Notifications</strong>
                        <small>{citizenUnreadCount} unread</small>
                      </span>
                      {citizenUnreadCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markAllCitizenNotificationsRead()}
                        >
                          Mark all as read
                        </button>
                      )}
                    </header>
                    <div className="admin-notification-list">
                      {citizenNotificationsLoading ? (
                        <p className="admin-notification-state">
                          Loading notifications…
                        </p>
                      ) : citizenNotificationsError ? (
                        <p className="admin-notification-state admin-notification-state--error">
                          {citizenNotificationsError}
                        </p>
                      ) : citizenNotifications.length ? (
                        citizenNotifications.map((notification) => (
                          <button
                            type="button"
                            key={notification.id}
                            className={`admin-notification-item ${notification.unread ? "" : "admin-notification-item--read"}`}
                            onClick={() => openCitizenNotification(notification)}
                          >
                            <span
                              className={`admin-notification-item__dot admin-notification-item__dot--${notification.tone}`}
                            />
                            <span>
                              <strong>{notification.title}</strong>
                              <small>{notification.message}</small>
                              <time>{notification.time}</time>
                            </span>
                            <ChevronRight size={16} />
                          </button>
                        ))
                      ) : (
                        <p className="admin-notification-state">
                          No complaint notifications yet.
                        </p>
                      )}
                    </div>
                  </section>
                )}
              </div>
            )}
            <button
              className="profile-chip"
              onClick={() =>
                navigate(type === "admin" ? "admin-profile" : "profile")
              }
            >
              <span className="avatar">
                {citizenInitials || (type === "admin" ? "A" : "C")}
              </span>
              <span>
                <strong>
                  {activeName}
                </strong>
                <small>
                  {type === "admin"
                    ? profile?.admin_title || "System Administrator"
                    : profile?.nid_verified
                      ? "Verified Citizen"
                      : "Citizen Account"}
                </small>
              </span>
              <ChevronRight size={16} />
            </button>
            {type === "admin" && (
              <button className="preview-link" onClick={onPreview}>
                <span>21</span> UI screens
              </button>
            )}
          </div>
        </header>
        <div className="workspace__content">{children}</div>
      </main>
    </div>
  );
}

export function EmptyState({
  icon: Icon = ClipboardList,
  title,
  description,
  action,
}) {
  return (
    <div className="empty-state">
      <span>
        <Icon size={30} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function Modal({ title, children, close }) {
  return (
    <div
      className="modal-layer"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        className="modal-layer__backdrop"
        onClick={close}
        aria-label="Close dialog"
      />
      <div className="modal-card">
        <div className="modal-card__head">
          <h2>{title}</h2>
          <IconButton icon={X} label="Close" onClick={close} />
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toast({ message, onClose }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3200);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className="toast">
      <CheckCircle2 size={20} />
      <span>{message}</span>
      <IconButton icon={X} label="Dismiss" onClick={onClose} />
    </div>
  );
}

export function BackToPreview({ navigate }) {
  return (
    <Button
      variant="ghost"
      icon={ArrowLeft}
      onClick={() => navigate("preview")}
    >
      All UI screens
    </Button>
  );
}

export function Tick({ checked = true }) {
  return (
    <span className={`tick ${checked ? "tick--checked" : ""}`}>
      {checked && <Check size={14} />}
    </span>
  );
}

export function TrustRing({
  value = 86,
  label = "Trust score",
  suffix = "",
}) {
  return (
    <div className="trust-ring" style={{ "--value": `${value * 3.6}deg` }}>
      <div>
        <strong>{value}{suffix}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

export function MapSnapshot({ compact = false }) {
  return (
    <div className={`map-snapshot ${compact ? "map-snapshot--compact" : ""}`}>
      <div className="map-snapshot__grid" />
      <span className="map-snapshot__road road-a" />
      <span className="map-snapshot__road road-b" />
      <span className="map-snapshot__pin">
        <MapPin size={22} />
      </span>
      <div className="map-snapshot__label">
        <ShieldCheck size={15} /> Inside service area
      </div>
    </div>
  );
}
