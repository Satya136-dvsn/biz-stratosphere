// © 2026 VenkataSatyanarayana Duba
// Biz Stratosphere - Proprietary Software
// Unauthorized copying or distribution prohibited.

import { StrictMode } from "react";
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from "./components/ThemeProvider";
import App from './App.tsx';

// ✅ Performance: CSS is a blocking resource — import before JS side-effects
import './index.css';

// ✅ Initialize monitoring AFTER core imports to avoid blocking render
import { initializeAnalytics, trackWebVitals } from "./lib/analytics";
import { initializeErrorTracking } from "./lib/errorTracking";

initializeErrorTracking();
initializeAnalytics();
trackWebVitals();

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error('[CRITICAL] Root element #root not found in DOM.');

createRoot(rootEl).render(
    <StrictMode>
        <HelmetProvider>
            <ThemeProvider defaultTheme="dark" storageKey="biz-stratosphere-theme" attribute="class">
                <App />
            </ThemeProvider>
        </HelmetProvider>
    </StrictMode>
);
