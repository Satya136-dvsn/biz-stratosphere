import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { StrictMode } from "react";
import { initializeAnalytics, trackWebVitals } from "./lib/analytics";
import { initializeErrorTracking } from "./lib/errorTracking";

// ⬇️ import the test function
import { testConnection } from './testsupabase';

// Initialize analytics and monitoring
initializeAnalytics();
initializeErrorTracking();
trackWebVitals();

import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <HelmetProvider>
            <App />
        </HelmetProvider>
    </StrictMode>
);

// ⬇️ run test once when app loads
testConnection();
