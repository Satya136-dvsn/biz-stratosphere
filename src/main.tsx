import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './professional-ui.css'; // Professional UI enhancements
import { StrictMode } from "react";
import { initializeAnalytics, trackWebVitals } from "./lib/analytics";
import { initializeErrorTracking } from "./lib/errorTracking";

// ⬇️ import the test function
import { testConnection } from './testsupabase';

// Initialize analytics and monitoring
initializeAnalytics();
initializeErrorTracking();
trackWebVitals();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>
);

// ⬇️ run test once when app loads
testConnection();
