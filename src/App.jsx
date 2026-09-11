// Main application controller: routes screens, stores demo state and controls themes.
import React from "react";
import { ThemeToggle, Toast } from "./components/Common";
import { complaintsSeed, notificationsSeed, usersSeed } from "./data";
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

function screenFromHash() {
  const screen = window.location.hash.replace(/^#\/?/, "") || "home";
  return knownScreens.has(screen) ? screen : "preview";
}

export default function App() {
  // Shared interface state used by the public, citizen and administrator pages.
  const [screen, setScreen] = React.useState(screenFromHash);
  const [theme, setTheme] = React.useState(
    () => document.documentElement.dataset.theme || "dark",
  );
  const [complaints, setComplaints] = React.useState(complaintsSeed);
  const [notifications, setNotifications] = React.useState(notificationsSeed);
  const [location, setLocation] = React.useState([23.7808, 90.4071]);
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

  const navigate = React.useCallback((nextScreen) => {
    window.location.hash = `/${nextScreen}`;
  }, []);

  const showToast = React.useCallback((message) => setToast(message), []);
  const toggleTheme = React.useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const addComplaint = React.useCallback((payload) => {
    const complaint = {
      id: "CC-24102",
      date: "10 Sep 2026",
      status: "Pending",
      priority: payload.category === "Emergency" ? "Urgent" : "Normal",
      ...payload,
    };
    setComplaints((current) => [
      complaint,
      ...current.filter((item) => item.id !== complaint.id),
    ]);
  }, []);

  const markAllRead = React.useCallback(() => {
    setNotifications((current) =>
      current.map((item) => ({ ...item, unread: false })),
    );
    showToast("All notifications marked as read");
  }, [showToast]);

  const shared = { navigate, showToast };
  const activeComplaint = complaints[0];
  const activeUser = usersSeed[0];

  // Screen registry: each route name maps to its matching React page component.
  const screens = {
    home: <HomePage {...shared} />,
    preview: <PreviewPage {...shared} />,
    register: <RegistrationPage {...shared} />,
    login: <LoginPage {...shared} />,
    "citizen-dashboard": (
      <CitizenDashboard {...shared} complaints={complaints} />
    ),
    "submit-complaint": (
      <SubmitComplaint
        {...shared}
        complaints={complaints}
        location={location}
        addComplaint={addComplaint}
      />
    ),
    location: (
      <LocationSelection
        {...shared}
        location={location}
        setLocation={setLocation}
      />
    ),
    "submission-confirmation": (
      <SubmissionConfirmation {...shared} complaint={activeComplaint} />
    ),
    "my-complaints": <MyComplaints {...shared} complaints={complaints} />,
    "complaint-details": (
      <ComplaintDetails {...shared} complaint={activeComplaint} />
    ),
    profile: <ProfilePage {...shared} complaints={complaints} />,
    notifications: (
      <NotificationsPage
        {...shared}
        notifications={notifications}
        markAllRead={markAllRead}
      />
    ),
    "admin-dashboard": <AdminDashboard {...shared} complaints={complaints} />,
    "admin-profile": <AdminProfile {...shared} />,
    "manage-complaints": (
      <ManageComplaints {...shared} complaints={complaints} />
    ),
    "edit-complaint": <EditComplaint {...shared} complaint={activeComplaint} />,
    "user-management": <UserManagement {...shared} users={usersSeed} />,
    "edit-user": <EditUser {...shared} user={activeUser} />,
    "verification-review": <VerificationReview {...shared} user={activeUser} />,
    "report-authority": (
      <ReportAuthority {...shared} complaint={activeComplaint} />
    ),
    "validity-review": (
      <ValidityReview {...shared} complaint={activeComplaint} />
    ),
    "point-degradation": <PointDegradation {...shared} />,
  };

  return (
    <>
      {screens[screen] || screens.preview}
      <footer className="site-footer">All rights reserved © Team Void</footer>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </>
  );
}
