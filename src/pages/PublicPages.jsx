// Public-facing pages: home, registration, login and interface directory.
import React from "react";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
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
} from "lucide-react";
import {
  BackToPreview,
  Badge,
  Button,
  Field,
  Logo,
  MapSnapshot,
  Panel,
} from "../components/Common";
import { useAuth } from "../context/AuthContext";
import { uiScreens } from "../data";

function readableAuthError(error) {
  const message = error?.message || "Something went wrong. Please try again.";
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "The email address or password is incorrect.";
  }
  if (message.toLowerCase().includes("user already registered")) {
    return "An account already exists with this email address.";
  }
  if (message.toLowerCase().includes("database error saving new user")) {
    return "This email address or NID may already be registered.";
  }
  return message;
}

export function HomePage({ navigate }) {
  return (
    <div className="public-page home-page">
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <header className="public-nav container">
        <Logo onClick={() => navigate("home")} />
        <nav>
          <button className="active">Home</button>
          <button onClick={() => navigate("submit-complaint")}>
            Report waste
          </button>
          <button onClick={() => navigate("my-complaints")}>
            Track complaint
          </button>
          <button onClick={() => navigate("preview")}>All screens</button>
        </nav>
        <div className="public-nav__actions">
          <Button variant="ghost" onClick={() => navigate("login")}>
            Log in
          </Button>
          <Button onClick={() => navigate("register")}>Create account</Button>
        </div>
      </header>

      <main>
        <section className="hero container">
          <div className="hero__content">
            <Badge tone="glass">
              <Sparkles size={14} /> Cleaner streets start with one report
            </Badge>
            <h1>
              See it. Report it.
              <br />
              <span>Make the city better.</span>
            </h1>
            <p>
              Report waste, waterlogging or urgent civic issues with an exact
              location and follow every update from one place.
            </p>
            <div className="hero__actions">
              <Button
                icon={Recycle}
                onClick={() => navigate("submit-complaint")}
              >
                Submit complaint
              </Button>
              <Button
                variant="glass"
                icon={FileSearch}
                onClick={() => navigate("my-complaints")}
              >
                Track complaint
              </Button>
            </div>
            <div className="hero__proof">
              <span className="avatar-stack">
                <i>NR</i>
                <i>FH</i>
                <i>MK</i>
              </span>
              <span>
                <strong>2,480+</strong>
                <small>verified citizens reporting responsibly</small>
              </span>
            </div>
          </div>

          <div className="hero__visual">
            <div className="visual-orbit orbit-a" />
            <div className="visual-orbit orbit-b" />
            <MapSnapshot />
            <article className="floating-card floating-card--top">
              <span className="pulse-icon">
                <LocateFixed size={19} />
              </span>
              <div>
                <small>LOCATION TAGGED</small>
                <strong>Demo Zone A, Ward 01</strong>
              </div>
              <CheckCircle2 size={20} />
            </article>
            <article className="floating-card floating-card--bottom">
              <div className="mini-progress">
                <span>78%</span>
              </div>
              <div>
                <small>COMPLAINT PROGRESS</small>
                <strong>Team dispatched</strong>
              </div>
            </article>
          </div>
        </section>

        <section className="benefit-strip container">
          <article>
            <span>
              <Recycle size={22} />
            </span>
            <div>
              <strong>Easy reporting</strong>
              <small>Complete a report in a few clear steps.</small>
            </div>
          </article>
          <article>
            <span>
              <MapPin size={22} />
            </span>
            <div>
              <strong>Accurate location</strong>
              <small>Pin the exact place within the service area.</small>
            </div>
          </article>
          <article>
            <span>
              <ShieldCheck size={22} />
            </span>
            <div>
              <strong>Verified response</strong>
              <small>Follow transparent status updates.</small>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export function RegistrationPage({ navigate, showToast }) {
  const { signUp, checkNidAvailability, isConfigured } = useAuth();
  const [role, setRole] = React.useState("Citizen");
  const [showPassword, setShowPassword] = React.useState(false);
  const [form, setForm] = React.useState({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    nid: "",
  });
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [verified, setVerified] = React.useState(false);
  const [checkingNid, setCheckingNid] = React.useState(false);
  const [accepted, setAccepted] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const setField = (field) => (event) => {
    const value = field === "nid"
      ? event.target.value.replace(/\D/g, "").slice(0, 13)
      : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    if (field === "nid") setVerified(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    if (!verified) {
      setError("Please verify that the NID is valid and available.");
      return;
    }
    if (!accepted) {
      setError("Please accept the service terms to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await signUp({ ...form, password, role });
      if (data.session) {
        showToast("Account created successfully");
        navigate("citizen-dashboard", { authenticated: true });
      } else {
        showToast("Account created. Check your email to confirm your account.");
        navigate("login");
      }
    } catch (submitError) {
      setError(readableAuthError(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      navigate={navigate}
      title="Create your CleanCity account"
      description="A verified profile helps the response team act on trusted information."
    >
      <form className="auth-form" onSubmit={submit}>
        <div className="role-select">
          {["Citizen", "Volunteer"].map((item) => (
            <button
              type="button"
              key={item}
              className={role === item ? "selected" : ""}
              onClick={() => setRole(item)}
            >
              {item === "Citizen" ? <User size={20} /> : <Leaf size={20} />}
              <span>
                <strong>{item}</strong>
                <small>
                  {item === "Citizen"
                    ? "Report and track issues"
                    : "Optional community participation"}
                </small>
              </span>
              <i>{role === item && <CircleCheck size={17} />}</i>
            </button>
          ))}
        </div>
        <div className="form-grid form-grid--two">
          <Field label="Full name">
            <div className="input-wrap">
              <User size={17} />
              <input
                required
                value={form.fullName}
                onChange={setField("fullName")}
                autoComplete="name"
              />
            </div>
          </Field>
          <Field label="Phone number">
            <div className="input-wrap">
              <Phone size={17} />
              <input
                required
                value={form.phone}
                onChange={setField("phone")}
                autoComplete="tel"
              />
            </div>
          </Field>
        </div>
        <Field label="Email address">
          <div className="input-wrap">
            <Mail size={17} />
            <input
              type="email"
              required
              value={form.email}
              onChange={setField("email")}
              autoComplete="email"
            />
          </div>
        </Field>
        <Field label="Residential address">
          <div className="input-wrap">
            <MapPin size={17} />
            <input
              required
              value={form.address}
              onChange={setField("address")}
              autoComplete="street-address"
            />
          </div>
        </Field>
        <div className="form-grid form-grid--two">
          <Field label="Password">
            <div className="input-wrap">
              <Lock size={17} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </Field>
          <Field
            label="Confirm password"
            hint={
              confirm && password === confirm
                ? "Passwords match"
                : confirm
                  ? "Passwords do not match"
                  : ""
            }
          >
            <div
              className={`input-wrap ${confirm && password === confirm ? "input-wrap--success" : confirm ? "input-wrap--error" : ""}`}
            >
              <KeyRound size={17} />
              <input
                type="password"
                required
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
              />
              {confirm && password === confirm && <CheckCircle2 size={17} />}
            </div>
          </Field>
        </div>
        <Field
          label="National ID number"
          hint="Only the final four digits are stored. Administrative verification remains pending."
        >
          <div
            className={`verify-row ${verified ? "verify-row--success" : ""}`}
          >
            <div className="input-wrap">
              <BadgeCheck size={17} />
              <input
                required
                value={form.nid}
                onChange={setField("nid")}
                inputMode="numeric"
                pattern="(?:[0-9]{10}|[0-9]{13})"
                minLength={10}
                maxLength={13}
                autoComplete="off"
              />
            </div>
            <Button
              type="button"
              variant={verified ? "success" : "outline"}
              disabled={checkingNid || !isConfigured}
              onClick={async () => {
                const nidLength = form.nid.replace(/\D/g, "").length;
                if (![10, 13].includes(nidLength)) {
                  setError("Enter a valid 10 or 13-digit NID number.");
                  return;
                }
                setCheckingNid(true);
                setError("");
                try {
                  const result = await checkNidAvailability(form.nid);
                  if (!result.available) {
                    setVerified(false);
                    setError("An account already exists with this NID number.");
                    return;
                  }
                  setVerified(true);
                } catch (nidError) {
                  setVerified(false);
                  setError(readableAuthError(nidError));
                } finally {
                  setCheckingNid(false);
                }
              }}
            >
              {checkingNid
                ? "Checking…"
                : verified
                  ? "NID available"
                  : "Check NID"}
            </Button>
          </div>
        </Field>
        <label className="check-row">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          <span>
            I agree to the CleanCity service terms and responsible-reporting
            policy.
          </span>
        </label>
        {(!isConfigured || error) && (
          <p className="form-message form-message--error" role="alert">
            {!isConfigured
              ? "Supabase setup is required before registration can be used."
              : error}
          </p>
        )}
        <Button
          className="button--full"
          type="submit"
          icon={UserPlus}
          disabled={submitting || !isConfigured}
        >
          {submitting ? "Creating account…" : "Create account"}
        </Button>
        <p className="auth-switch">
          Already registered?{" "}
          <button type="button" onClick={() => navigate("login")}>
            Log in
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}

export function LoginPage({ navigate, showToast }) {
  const { signIn, isConfigured } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
      let destination = "citizen-dashboard";
      try {
        destination =
          sessionStorage.getItem("cleancity-return-to") || destination;
        sessionStorage.removeItem("cleancity-return-to");
      } catch {
        // Continue to the dashboard if browser storage is unavailable.
      }
      showToast("Welcome back to CleanCity");
      navigate(destination, { authenticated: true });
    } catch (submitError) {
      setError(readableAuthError(submitError));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <AuthLayout
      navigate={navigate}
      title="Welcome back"
      description="Log in to report an issue or follow an existing complaint."
      compact
      hideBackLink
    >
      <form className="auth-form" onSubmit={submit}>
        <Field label="Email address">
          <div className="input-wrap">
            <Mail size={17} />
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>
        </Field>
        <Field label="Password">
          <div className="input-wrap">
            <Lock size={17} />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>
        <div className="form-between">
          <label className="check-row">
            <input type="checkbox" defaultChecked />
            <span>Remember me</span>
          </label>
          <button type="button">Forgot password?</button>
        </div>
        {(!isConfigured || error) && (
          <p className="form-message form-message--error" role="alert">
            {!isConfigured
              ? "Supabase setup is required before login can be used."
              : error}
          </p>
        )}
        <Button
          className="button--full"
          type="submit"
          disabled={submitting || !isConfigured}
        >
          {submitting ? "Logging in…" : "Log in"}{" "}
          {!submitting && <ArrowRight size={17} />}
        </Button>
        <p className="auth-switch">
          New to CleanCity?{" "}
          <button type="button" onClick={() => navigate("register")}>
            Create account
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({
  navigate,
  title,
  description,
  children,
  compact = false,
  hideBackLink = false,
}) {
  return (
    <div className="auth-page">
      <div className="auth-page__visual">
        <Logo onClick={() => navigate("home")} />
        <div className="auth-story">
          <Badge tone="glass">
            <Leaf size={14} /> Community-powered city care
          </Badge>
          <h2>
            Small reports create
            <br />
            <span>visible change.</span>
          </h2>
          <p>
            Accurate information connects citizens with the right response team,
            faster.
          </p>
          <div className="auth-impact">
            <article>
              <strong>94%</strong>
              <small>location accuracy</small>
            </article>
            <article>
              <strong>1.8h</strong>
              <small>average review time</small>
            </article>
            <article>
              <strong>2.4k</strong>
              <small>verified citizens</small>
            </article>
          </div>
        </div>
        <MapSnapshot compact />
      </div>
      <div className="auth-page__form">
        <div className={`auth-card ${compact ? "auth-card--compact" : ""}`}>
          {!hideBackLink && (
            <div className="auth-card__top">
              <BackToPreview navigate={navigate} />
            </div>
          )}
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
        <Logo onClick={() => navigate("home")} />
        <Button variant="glass" onClick={() => navigate("home")}>
          Open product home
        </Button>
      </header>
      <main className="container preview-page__main">
        <div className="preview-groups">
          {uiScreens.map((group) => (
            <section key={group.group}>
              <div className="preview-group__title">
                <span>{group.group}</span>
                <small>{group.items.length} screens</small>
              </div>
              <div className="preview-grid">
                {group.items.map(([id, title, description], index) => (
                  <button
                    key={id}
                    className="screen-card"
                    onClick={() => navigate(id)}
                  >
                    <span className="screen-card__number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="screen-card__icon">
                      {group.group === "Public" ? (
                        <Leaf size={21} />
                      ) : group.group === "Citizen" ? (
                        <User size={21} />
                      ) : (
                        <ShieldCheck size={21} />
                      )}
                    </span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                    <span className="screen-card__open">
                      Open interface <ArrowRight size={15} />
                    </span>
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
