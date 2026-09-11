// Application entry point: loads global styles and mounts React in the root element.
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CitizenDataProvider } from "./context/CitizenDataContext";
import "./styles.css";
import "./styles-extra.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <CitizenDataProvider>
        <App />
      </CitizenDataProvider>
    </AuthProvider>
  </React.StrictMode>,
);
