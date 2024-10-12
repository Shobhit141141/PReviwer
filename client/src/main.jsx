import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes/dist/cjs/index.js";
import Navbar from "./components/Navbar.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Theme appearance="dark">
      <AuthProvider>
        <main>
          <App />
        </main>
      </AuthProvider>
    </Theme>
  </StrictMode>
);
