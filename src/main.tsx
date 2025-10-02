import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ⬇️ import the test function
import { testConnection } from './testsupabase';

createRoot(document.getElementById("root")!).render(<App />);

// ⬇️ run test once when app loads
testConnection();
