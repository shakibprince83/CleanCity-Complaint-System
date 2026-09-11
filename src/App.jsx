// Main application controller: routes screens, stores demo state and controls themes.
import React from "react";
import { ThemeToggle, Toast } from "./components/Common";
import { useAuth } from "./context/AuthContext";
import { useCitizenData } from "./context/CitizenDataContext";
import { complaintsSeed, usersSeed } from "./data";
import {
  HomePage,
  LoginPage,
  PreviewPage,
  RegistrationPage,
} from "./pages/PublicPages";
import {
  CitizenDashboard,
  ComplaintDetails,
  LocationSelection,
  MyComplaints,
  NotificationsPage,
  ProfilePage,
  SubmissionConfirmation,
  SubmitComplaint,
} from "./pages/CitizenPages";
import {
  AdminDashboard,
  AdminProfile,
  EditComplaint,
  EditUser,
  ManageComplaints,
  PointDegradation,
  ReportAuthority,
  UserManagement,
  VerificationReview,
  ValidityReview,
} from "./pages/AdminPages";

// Every screen available through the hash-based navigation.
const knownScreens = new Set([
  "home",
  "preview",
  "register",
  "login",
  "citizen-dashboard",
  "submit-complaint",
  "location",
  "submission-confirmation",
  "my-complaints",
  "complaint-details",
  "profile",
  "notifications",
  "admin-dashboard",
  "manage-complaints",
  "edit-complaint",
  "admin-profile",
  "user-management",
  "edit-user",
  "verification-review",
  "report-authority",
  "validity-review",
  "point-degradation",
]);

// Citizen pages require an authenticated Supabase session.
const protectedCitizenScreens = new Set([
  "citizen-dashboard",
  "submit-complaint",
  "location",
  "submission-confirmation",
  "my-complaints",
  "complaint-details",
  "profile",
  "notifications",
]);

function screenFromHash() {
  const screen = window.location.hash.replace(/^#\/?/, "") || "home";
  return knownScreens.has(screen) ? screen : "preview";
}

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const {
    complaints: citizenComplaints,
    notifications,
    loading: citizenDataLoading,
    addComplaint,
    markAllRead,
  } = useCitizenData();
  // Shared interface state used by the public, citizen and administrator pages.
  const [screen, setScreen] = React.useState(screenFromHash);
  const [theme, setTheme] = React.useState(
    () => document.documentElement.dataset.theme || "dark",
  );
  const [adminComplaints] = React.useState(complaintsSeed);
  const [location, setLocation] = React.useState([23.7808, 90.4071]);
  const [locationAddress, setLocationAddress] = React.useState("");
  const [toast, setToast] = React.useState("");

  React.useEffect(() => {
    const updateScreen = () => setScreen(screenFromHash());
    window.addEventListener("hashchange", updateScreen);
    return () => window.removeEventListener("hashchange", updateScreen);
  }, []);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [screen]);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "light" ? "#eef5f0" : "#071a12");
    try {
      localStorage.setItem("cleancity-theme", theme);
    } catch {
      // Theme switching still works when browser storage is unavailable.
    }
  }, [theme]);

  const navigate = React.useCallback(
    (nextScreen, options = {}) => {
      if (
        protectedCitizenScreens.has(nextScreen) &&
        !user &&
        !authLoading &&
        !options.authenticated
      ) {
        try {
          sessionStorage.setItem("cleancity-return-to", nextScreen);
        } catch {
          // Authentication still works if browser storage is unavailable.
        }
        window.location.hash = "/login";
        return;
      }
      window.location.hash = `/${nextScreen}`;
    },
    [authLoading, user],
  );

  const showToast = React.useCallback((message) => setToast(message), []);
  const toggleTheme = React.useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const shared = { navigate, showToast };
  const activeComplaint = citizenComplaints[0];
  const activeAdminComplaint = adminComplaints[0];
  const activeUser = usersSeed[0];
  const displayScreen =
    protectedCitizenScreens.has(screen) && !user ? "login" : screen;

  // Screen registry: each route name maps to its matching React page component.
  const screens = {
    home: <HomePage {...shared} />,
    preview: <PreviewPage {...shared} />,
    register: <RegistrationPage {...shared} />,
    login: <LoginPage {...shared} />,
    "citizen-dashboard": (
      <CitizenDashboard
        {...shared}
        complaints={citizenComplaints}
        dataLoading={citizenDataLoading}
      />
    ),
    "submit-complaint": (
      <SubmitComplaint
        {...shared}
        location={location}
        locationAddress={locationAddress}
        addComplaint={addComplaint}
      />
    ),
    location: (
      <LocationSelection
        {...shared}
        location={location}
        setLocation={setLocation}
        address={locationAddress}
        setAddress={setLocationAddress}
      />
    ),
    "submission-confirmation": (
      <SubmissionConfirmation {...shared} complaint={activeComplaint} />
    ),
    "my-complaints": <MyComplaints {...shared} complaints={citizenComplaints} />,
    "complaint-details": (
      <ComplaintDetails {...shared} complaint={activeComplaint} />
    ),
    profile: <ProfilePage {...shared} complaints={citizenComplaints} />,
    notifications: (
      <NotificationsPage
        {...shared}
        notifications={notifications}
        markAllRead={async () => {
          await markAllRead();
          showToast("All notifications marked as read");
        }}
      />
    ),
    "admin-dashboard": <AdminDashboard {...shared} complaints={adminComplaints} />,
    "admin-profile": <AdminProfile {...shared} />,
    "manage-complaints": (
      <ManageComplaints {...shared} complaints={adminComplaints} />
    ),
    "edit-complaint": <EditComplaint {...shared} complaint={activeAdminComplaint} />,
    "user-management": <UserManagement {...shared} users={usersSeed} />,
    "edit-user": <EditUser {...shared} user={activeUser} />,
    "verification-review": <VerificationReview {...shared} user={activeUser} />,
    "report-authority": (
      <ReportAuthority {...shared} complaint={activeAdminComplaint} />
    ),
    "validity-review": (
      <ValidityReview {...shared} complaint={activeAdminComplaint} />
    ),
    "point-degradation": <PointDegradation {...shared} />,
  };

  return (
    <>
      {authLoading ? (
        <main className="auth-loading" role="status" aria-live="polite">
          <span className="auth-spinner" />
          <strong>Restoring your secure session…</strong>
        </main>
      ) : (
        screens[displayScreen] || screens.preview
      )}
      <footer className="site-footer">All rights reserved © Team Void</footer>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </>
  );
}
