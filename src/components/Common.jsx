import React from 'react';
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
} from 'lucide-react';
import { adminSidebar, citizenSidebar } from '../data';

const iconMap = {
  'citizen-dashboard': LayoutDashboard,
  'submit-complaint': Plus,
  'my-complaints': ClipboardList,
  notifications: Bell,
  profile: User,
  'admin-dashboard': LayoutDashboard,
  'admin-profile': User,
  'manage-complaints': FileText,
  'user-management': Users,
  'report-authority': BarChart3,
};

export function Logo({ onClick, compact = false }) {
  return (
    <button className={`brand ${compact ? 'brand--compact' : ''}`} onClick={onClick} aria-label="CleanCity home">
      <span className="brand__mark"><Leaf size={22} strokeWidth={2.4} /></span>
      {!compact && <span><strong>Clean</strong>City</span>}
    </button>
  );
}

export function Badge({ children, tone = 'green' }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function StatusBadge({ status }) {
  const tone = {
    Resolved: 'green',
    Active: 'green',
    'In Progress': 'blue',
    Assigned: 'violet',
    'Under Review': 'gold',
    Pending: 'gold',
    Inactive: 'gray',
    Urgent: 'red',
    High: 'orange',
    Medium: 'gold',
    Normal: 'green',
  }[status] || 'gray';
  return <Badge tone={tone}><span className="badge__dot" />{status}</Badge>;
}

export function Button({ children, variant = 'primary', icon: Icon, className = '', ...props }) {
  return (
    <button className={`button button--${variant} ${className}`} {...props}>
      {Icon && <Icon size={17} />}
      <span>{children}</span>
    </button>
  );
}

export function IconButton({ icon: Icon, label, className = '', ...props }) {
  return <button className={`icon-button ${className}`} aria-label={label} title={label} {...props}><Icon size={19} /></button>;
}

export function ThemeToggle({ theme = 'dark', onToggle }) {
  const isLight = theme === 'light';
  const nextTheme = isLight ? 'Dark' : 'Light';
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
      <span className="theme-toggle__icon"><Icon size={18} /></span>
      <span><strong>{nextTheme}</strong><small>mode</small></span>
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

export function StatCard({ label, value, note, icon: Icon = Activity, tone = 'green', selected = false }) {
  return (
    <article className={`stat-card stat-card--${tone} ${selected ? 'stat-card--selected' : ''}`}>
      <div className="stat-card__top"><span>{label}</span><span className="stat-card__icon"><Icon size={18} /></span></div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search' }) {
  return (
    <label className="search-box">
      <Search size={18} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`field ${className}`}>
      <span className="field__label">{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Panel({ children, className = '', title, action }) {
  return (
    <section className={`panel ${className}`}>
      {(title || action) && <div className="panel__header"><h2>{title}</h2>{action}</div>}
      {children}
    </section>
  );
}

function SideNav({ type, active, navigate, open, close }) {
  const items = type === 'admin' ? adminSidebar : citizenSidebar;
  return (
    <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
      <div className="sidebar__head">
        <Logo onClick={() => navigate('home')} />
        <IconButton icon={X} label="Close menu" className="sidebar__close" onClick={close} />
      </div>
      <div className="sidebar__caption">{type === 'admin' ? 'ADMINISTRATION' : 'CITIZEN PORTAL'}</div>
      <nav className="sidebar__nav">
        {items.map(([id, label]) => {
          const Icon = iconMap[id] || Home;
          return (
            <button key={id} className={active === id ? 'active' : ''} onClick={() => { navigate(id); close(); }}>
              <Icon size={19} /><span>{label}</span>
              {id === 'notifications' && <span className="nav-count">2</span>}
            </button>
          );
        })}
      </nav>
      <div className="sidebar__bottom">
        <button><Settings size={18} />Settings</button>
        <button><HelpCircle size={18} />Help centre</button>
        <button onClick={() => navigate('home')}><LogOut size={18} />Sign out</button>
      </div>
      <div className="sidebar__eco">
        <span><Leaf size={16} /> Cleaner city impact</span>
        <strong>78%</strong>
        <div><i /></div>
        <small>12 verified reports this month</small>
      </div>
    </aside>
  );
}

export function AppShell({ type = 'citizen', active, navigate, children, onPreview }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="app-shell">
      <SideNav type={type} active={active} navigate={navigate} open={open} close={() => setOpen(false)} />
      {open && <button className="sidebar-backdrop" onClick={() => setOpen(false)} aria-label="Close navigation" />}
      <main className="workspace">
        <header className="topbar">
          <IconButton icon={Menu} label="Open menu" className="topbar__menu" onClick={() => setOpen(true)} />
          <SearchBox value="" onChange={() => {}} placeholder={type === 'admin' ? 'Search complaints, users or reports' : 'Search your complaints'} />
          <div className="topbar__actions">
            <IconButton icon={Bell} label="Notifications" onClick={() => navigate(type === 'admin' ? 'admin-dashboard' : 'notifications')} />
            <button className="profile-chip" onClick={() => navigate(type === 'admin' ? 'admin-profile' : 'profile')}>
              <span className="avatar">{type === 'admin' ? 'DA' : 'DC'}</span>
              <span><strong>{type === 'admin' ? 'Demo Administrator' : 'Demo Citizen'}</strong><small>{type === 'admin' ? 'System Administrator' : 'Verified Citizen'}</small></span>
              <ChevronRight size={16} />
            </button>
            <button className="preview-link" onClick={onPreview}><span>21</span> UI screens</button>
          </div>
        </header>
        <div className="workspace__content">{children}</div>
      </main>
    </div>
  );
}

export function EmptyState({ icon: Icon = ClipboardList, title, description, action }) {
  return (
    <div className="empty-state">
      <span><Icon size={30} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function Modal({ title, children, close }) {
  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label={title}>
      <button className="modal-layer__backdrop" onClick={close} aria-label="Close dialog" />
      <div className="modal-card">
        <div className="modal-card__head"><h2>{title}</h2><IconButton icon={X} label="Close" onClick={close} /></div>
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
  return <div className="toast"><CheckCircle2 size={20} /><span>{message}</span><IconButton icon={X} label="Dismiss" onClick={onClose} /></div>;
}

export function BackToPreview({ navigate }) {
  return <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate('preview')}>All UI screens</Button>;
}

export function Tick({ checked = true }) {
  return <span className={`tick ${checked ? 'tick--checked' : ''}`}>{checked && <Check size={14} />}</span>;
}

export function TrustRing({ value = 86, label = 'Trust score' }) {
  return (
    <div className="trust-ring" style={{ '--value': `${value * 3.6}deg` }}>
      <div><strong>{value}</strong><small>{label}</small></div>
    </div>
  );
}

export function MapSnapshot({ compact = false }) {
  return (
    <div className={`map-snapshot ${compact ? 'map-snapshot--compact' : ''}`}>
      <div className="map-snapshot__grid" />
      <span className="map-snapshot__road road-a" />
      <span className="map-snapshot__road road-b" />
      <span className="map-snapshot__pin"><MapPin size={22} /></span>
      <div className="map-snapshot__label"><ShieldCheck size={15} /> Inside service area</div>
    </div>
  );
}
