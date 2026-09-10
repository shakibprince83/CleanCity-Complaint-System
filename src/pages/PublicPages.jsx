import React from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  Eye,
  EyeOff,
  FileSearch,
  KeyRound,
  Leaf,
  LocateFixed,
  Lock,
  Mail,
  MapPin,
  Phone,
  Recycle,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Waves,
} from 'lucide-react';
import { BackToPreview, Badge, Button, Field, Logo, MapSnapshot, Panel } from '../components/Common';
import { uiScreens } from '../data';

export function HomePage({ navigate }) {
  return (
    <div className="public-page home-page">
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <header className="public-nav container">
        <Logo onClick={() => navigate('home')} />
        <nav>
          <button className="active">Home</button>
          <button onClick={() => navigate('submit-complaint')}>Report waste</button>
          <button onClick={() => navigate('my-complaints')}>Track complaint</button>
          <button onClick={() => navigate('preview')}>All screens</button>
        </nav>
        <div className="public-nav__actions">
          <Button variant="ghost" onClick={() => navigate('login')}>Log in</Button>
          <Button onClick={() => navigate('register')}>Create account</Button>
        </div>
      </header>

      <main>
        <section className="hero container">
          <div className="hero__content">
            <Badge tone="glass"><Sparkles size={14} /> Cleaner streets start with one report</Badge>
            <h1>See it. Report it.<br /><span>Make the city better.</span></h1>
            <p>Report waste, waterlogging or urgent civic issues with an exact location and follow every update from one place.</p>
            <div className="hero__actions">
              <Button icon={Recycle} onClick={() => navigate('submit-complaint')}>Submit complaint</Button>
              <Button variant="glass" icon={FileSearch} onClick={() => navigate('my-complaints')}>Track complaint</Button>
            </div>
            <div className="hero__proof">
              <span className="avatar-stack"><i>NR</i><i>FH</i><i>MK</i></span>
              <span><strong>2,480+</strong><small>verified citizens reporting responsibly</small></span>
            </div>
          </div>

          <div className="hero__visual">
            <div className="visual-orbit orbit-a" />
            <div className="visual-orbit orbit-b" />
            <MapSnapshot />
            <article className="floating-card floating-card--top">
              <span className="pulse-icon"><LocateFixed size={19} /></span>
              <div><small>LOCATION TAGGED</small><strong>Demo Zone A, Ward 01</strong></div>
              <CheckCircle2 size={20} />
            </article>
            <article className="floating-card floating-card--bottom">
              <div className="mini-progress"><span>78%</span></div>
              <div><small>COMPLAINT PROGRESS</small><strong>Team dispatched</strong></div>
            </article>
          </div>
        </section>

        <section className="benefit-strip container">
          <article><span><Recycle size={22} /></span><div><strong>Easy reporting</strong><small>Complete a report in a few clear steps.</small></div></article>
          <article><span><MapPin size={22} /></span><div><strong>Accurate location</strong><small>Pin the exact place within the service area.</small></div></article>
          <article><span><ShieldCheck size={22} /></span><div><strong>Verified response</strong><small>Follow transparent status updates.</small></div></article>
        </section>
      </main>
    </div>
  );
}

export function RegistrationPage({ navigate, showToast }) {
  const [role, setRole] = React.useState('Citizen');
  const [showPassword, setShowPassword] = React.useState(false);
  const [password, setPassword] = React.useState('CleanCity#26');
  const [confirm, setConfirm] = React.useState('CleanCity#26');
  const [verified, setVerified] = React.useState(false);

  const submit = (event) => {
    event.preventDefault();
    if (password !== confirm) return;
    showToast('Demo account created successfully');
    navigate('citizen-dashboard');
  };

  return (
    <AuthLayout navigate={navigate} title="Create your CleanCity account" description="A verified profile helps the response team act on trusted information.">
      <form className="auth-form" onSubmit={submit}>
        <div className="role-select">
          {['Citizen', 'Volunteer'].map((item) => (
            <button type="button" key={item} className={role === item ? 'selected' : ''} onClick={() => setRole(item)}>
              {item === 'Citizen' ? <User size={20} /> : <Leaf size={20} />}
              <span><strong>{item}</strong><small>{item === 'Citizen' ? 'Report and track issues' : 'Optional community participation'}</small></span>
              <i>{role === item && <CircleCheck size={17} />}</i>
            </button>
          ))}
        </div>
        <div className="form-grid form-grid--two">
          <Field label="Full name"><div className="input-wrap"><User size={17} /><input required defaultValue="Demo Citizen" /></div></Field>
          <Field label="Phone number"><div className="input-wrap"><Phone size={17} /><input required defaultValue="+880 1XXX XXXXXX" /></div></Field>
        </div>
        <Field label="Email address"><div className="input-wrap"><Mail size={17} /><input type="email" required defaultValue="citizen@example.test" /></div></Field>
        <Field label="Residential address"><div className="input-wrap"><MapPin size={17} /><input required defaultValue="Demo Road A, Ward 01" /></div></Field>
        <div className="form-grid form-grid--two">
          <Field label="Password">
            <div className="input-wrap"><Lock size={17} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
          </Field>
          <Field label="Confirm password" hint={confirm && password === confirm ? 'Passwords match' : confirm ? 'Passwords do not match' : ''}>
            <div className={`input-wrap ${confirm && password === confirm ? 'input-wrap--success' : confirm ? 'input-wrap--error' : ''}`}><KeyRound size={17} /><input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />{confirm && password === confirm && <CheckCircle2 size={17} />}</div>
          </Field>
        </div>
        <Field label="National ID number" hint="Used only to verify your citizen account.">
          <div className={`verify-row ${verified ? 'verify-row--success' : ''}`}>
            <div className="input-wrap"><BadgeCheck size={17} /><input defaultValue="DEMO-NID-0001" /></div>
            <Button type="button" variant={verified ? 'success' : 'outline'} onClick={() => setVerified(true)}>{verified ? 'Verified' : 'Verify NID'}</Button>
          </div>
        </Field>
        <label className="check-row"><input type="checkbox" defaultChecked /><span>I agree to the CleanCity service terms and responsible-reporting policy.</span></label>
        <Button className="button--full" type="submit" icon={UserPlus}>Create account</Button>
        <p className="auth-switch">Already registered? <button type="button" onClick={() => navigate('login')}>Log in</button></p>
      </form>
    </AuthLayout>
  );
}

export function LoginPage({ navigate, showToast }) {
  const [showPassword, setShowPassword] = React.useState(false);
  const submit = (event) => {
    event.preventDefault();
    showToast('Welcome back, Demo Citizen');
    navigate('citizen-dashboard');
  };
  return (
    <AuthLayout navigate={navigate} title="Welcome back" description="Log in to report an issue or follow an existing complaint." compact>
      <form className="auth-form" onSubmit={submit}>
        <Field label="Email address or phone number"><div className="input-wrap"><Mail size={17} /><input required defaultValue="citizen@example.test" /></div></Field>
        <Field label="Password">
          <div className="input-wrap"><Lock size={17} /><input type={showPassword ? 'text' : 'password'} required defaultValue="CleanCity#26" /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
        </Field>
        <div className="form-between"><label className="check-row"><input type="checkbox" defaultChecked /><span>Remember me</span></label><button type="button">Forgot password?</button></div>
        <Button className="button--full" type="submit">Log in <ArrowRight size={17} /></Button>
        <div className="divider"><span>UI demonstration</span></div>
        <div className="demo-access">
          <button type="button" onClick={() => navigate('citizen-dashboard')}><User size={18} /><span><strong>Citizen preview</strong><small>Open citizen dashboard</small></span><ChevronRight size={16} /></button>
          <button type="button" onClick={() => navigate('admin-dashboard')}><ShieldCheck size={18} /><span><strong>Admin preview</strong><small>Open admin dashboard</small></span><ChevronRight size={16} /></button>
        </div>
        <p className="auth-switch">New to CleanCity? <button type="button" onClick={() => navigate('register')}>Create account</button></p>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({ navigate, title, description, children, compact = false }) {
  return (
    <div className="auth-page">
      <div className="auth-page__visual">
        <Logo onClick={() => navigate('home')} />
        <div className="auth-story">
          <Badge tone="glass"><Leaf size={14} /> Community-powered city care</Badge>
          <h2>Small reports create<br /><span>visible change.</span></h2>
          <p>Accurate information connects citizens with the right response team, faster.</p>
          <div className="auth-impact">
            <article><strong>94%</strong><small>location accuracy</small></article>
            <article><strong>1.8h</strong><small>average review time</small></article>
            <article><strong>2.4k</strong><small>verified citizens</small></article>
          </div>
        </div>
        <MapSnapshot compact />
      </div>
      <div className="auth-page__form">
        <div className={`auth-card ${compact ? 'auth-card--compact' : ''}`}>
          <div className="auth-card__top"><BackToPreview navigate={navigate} /></div>
          <h1>{title}</h1>
          <p>{description}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function PreviewPage({ navigate }) {
  return (
    <div className="preview-page">
      <div className="ambient ambient--one" />
      <header className="preview-page__header container">
        <Logo onClick={() => navigate('home')} />
        <div><Badge tone="green">SATURDAY UI UPDATE</Badge><span>21 complete interface screens</span></div>
        <Button variant="glass" onClick={() => navigate('home')}>Open product home</Button>
      </header>
      <main className="container preview-page__main">
        <div className="preview-intro">
          <span className="eyebrow">CLEAN CITY INTERFACE DIRECTORY</span>
          <h1>Every screen, ready to present.</h1>
          <p>Open each UI separately. The demonstration uses interactive sample data and does not require backend access.</p>
        </div>
        <div className="preview-groups">
          {uiScreens.map((group) => (
            <section key={group.group}>
              <div className="preview-group__title"><span>{group.group}</span><small>{group.items.length} screens</small></div>
              <div className="preview-grid">
                {group.items.map(([id, title, description], index) => (
                  <button key={id} className="screen-card" onClick={() => navigate(id)}>
                    <span className="screen-card__number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="screen-card__icon">{group.group === 'Public' ? <Leaf size={21} /> : group.group === 'Citizen' ? <User size={21} /> : <ShieldCheck size={21} />}</span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                    <span className="screen-card__open">Open interface <ArrowRight size={15} /></span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
