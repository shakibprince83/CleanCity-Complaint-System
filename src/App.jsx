// Main application controller: routes screens, stores demo state and controls themes.
import React from "react";
import { ThemeToggle, Toast } from "./components/Common";
import { useAuth } from "./context/AuthContext";
import { useCitizenData } from "./context/CitizenDataContext";
import { useAdminData } from "./context/AdminDataContext";
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
const protectedAdminScreens = new Set([
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
  const {
    user,
    profile,
    loading: authLoading,
    profileLoading,
  } = useAuth();
  const {
    complaints: citizenComplaints,
    notifications,
    loading: citizenDataLoading,
    addComplaint,
    markNotificationRead,
    markAllRead,
  } = useCitizenData();
  const {
    complaints: adminComplaints,
    users: adminUsers,
    loading: adminDataLoading,
    error: adminDataError,
    refresh: refreshAdminData,
    updateComplaint,
    updateUser,
  } = useAdminData();
  // Shared interface state used by the public, citizen and administrator pages.
  const hasAdminAccess =
    profile?.role === "admin" && profile?.account_status === "active";
  const [screen, setScreen] = React.useState(screenFromHash);
  const [theme, setTheme] = React.useState(
    () => document.documentElement.dataset.theme || "dark",
  );
  const [selectedAdminComplaintId, setSelectedAdminComplaintId] =
    React.useState(null);
  const [selectedUserId, setSelectedUserId] = React.useState(null);
  const [location, setLocation] = React.useState([23.7808, 90.4071]);
  const [locationAddress, setLocationAddress] = React.useState("");
  const [selectedComplaintId, setSelectedComplaintId] = React.useState(null);
  const [complaintDraft, setComplaintDraft] = React.useState({
    category: "Waste",
    equipment: false,
    title: "",
    description: "",
    photoFile: null,
  });
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
        protectedAdminScreens.has(nextScreen) &&
        (!user || !hasAdminAccess) &&
        !authLoading &&
        !profileLoading &&
        !options.authenticated
      ) {
        window.location.hash = user ? "/citizen-dashboard" : "/login";
        return;
      }
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
    [authLoading, hasAdminAccess, profileLoading, user],
  );

  const showToast = React.useCallback((message) => setToast(message), []);
  const toggleTheme = React.useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const shared = { navigate, showToast };
  const activeComplaint =
    citizenComplaints.find((item) => item.databaseId === selectedComplaintId) ||
    citizenComplaints[0];
  const activeAdminComplaint =
    adminComplaints.find((item) => item.databaseId === selectedAdminComplaintId) ||
    adminComplaints[0];
  const activeUser =
    adminUsers.find((item) => item.id === selectedUserId) || adminUsers[0];
  const displayScreen =
    protectedAdminScreens.has(screen) && !hasAdminAccess
      ? user
        ? "citizen-dashboard"
        : "login"
      : protectedCitizenScreens.has(screen) && !user
        ? "login"
        : screen;

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
        complaintDraft={complaintDraft}
        setComplaintDraft={setComplaintDraft}
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
        openNotification={async (notification) => {
          try {
            if (notification.unread) {
              await markNotificationRead(notification.id);
            }
            if (notification.complaintId) {
              setSelectedComplaintId(notification.complaintId);
              navigate("complaint-details");
            } else {
              showToast("Notification marked as read");
            }
          } catch (notificationError) {
            showToast(
              notificationError.message || "The notification could not be opened.",
            );
          }
        }}
        markAllRead={async () => {
          await markAllRead();
          showToast("All notifications marked as read");
        }}
      />
    ),
    "admin-dashboard": (
      <AdminDashboard
        {...shared}
        complaints={adminComplaints}
        loading={adminDataLoading}
        error={adminDataError}
        refresh={refreshAdminData}
        selectComplaint={(complaint) => {
          setSelectedAdminComplaintId(complaint.databaseId);
          navigate("edit-complaint");
        }}
      />
    ),
    "admin-profile": <AdminProfile {...shared} />,
    "manage-complaints": (
      <ManageComplaints
        {...shared}
        complaints={adminComplaints}
        loading={adminDataLoading}
        error={adminDataError}
        refresh={refreshAdminData}
        selectComplaint={(complaint) => {
          setSelectedAdminComplaintId(complaint.databaseId);
          navigate("edit-complaint");
        }}
      />
    ),
    "edit-complaint": activeAdminComplaint ? (
      <EditComplaint
        {...shared}
        complaint={activeAdminComplaint}
        updateComplaint={updateComplaint}
      />
    ) : (
      <ManageComplaints
        {...shared}
        complaints={adminComplaints}
        loading={adminDataLoading}
        error={adminDataError}
        refresh={refreshAdminData}
      />
    ),
    "user-management": (
      <UserManagement
        {...shared}
        users={adminUsers}
        loading={adminDataLoading}
        error={adminDataError}
        refresh={refreshAdminData}
        selectUser={(selectedUser) => {
          setSelectedUserId(selectedUser.id);
          navigate("edit-user");
        }}
      />
    ),
    "edit-user": activeUser ? (
      <EditUser {...shared} user={activeUser} updateUser={updateUser} />
    ) : (
      <UserManagement
        {...shared}
        users={adminUsers}
        loading={adminDataLoading}
        error={adminDataError}
        refresh={refreshAdminData}
      />
    ),
    "verification-review": activeUser ? (
      <VerificationReview {...shared} user={activeUser} />
    ) : (
      <UserManagement {...shared} users={adminUsers} />
    ),
    "report-authority": (
      activeAdminComplaint ? (
        <ReportAuthority {...shared} complaint={activeAdminComplaint} />
      ) : (
        <ManageComplaints {...shared} complaints={adminComplaints} />
      )
    ),
    "validity-review": (
      activeAdminComplaint ? (
        <ValidityReview {...shared} complaint={activeAdminComplaint} />
      ) : (
        <ManageComplaints {...shared} complaints={adminComplaints} />
      )
    ),
    "point-degradation": <PointDegradation {...shared} />,
  };

  return (
    <>
      {authLoading || (user && profileLoading) ? (
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
