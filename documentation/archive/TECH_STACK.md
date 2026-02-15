# Technology Stack

## Overview

Biz Stratosphere is built on a modern, serverless architecture designed for high performance, scalability, and zero operational costs. This document outlines the core technologies, libraries, and tools used in the project.

## Frontend

The frontend is a Single Page Application (SPA) built with React and TypeScript.

### Core Frameworks
- **React 18.3**: UI library for building interactive user interfaces.
- **TypeScript 5.0+**: Statically typed superset of JavaScript for better developer experience and code quality.
- **Vite 5.4**: Next-generation frontend tooling for fast development and bundling.

### State Management & Data Fetching
- **TanStack Query (React Query) v5**: Powerful asynchronous state management for server state, caching, and synchronization.
- **React Context API**: Used for global UI state (e.g., Theme, Toast notifications).
- **Zustand** (if applicable, otherwise relying on Context/Query): Lightweight state management.

### UI & Styling
- **Tailwind CSS 3.4**: Utility-first CSS framework for rapid UI development.
- **Shadcn UI**: Reusable components built using Radix UI and Tailwind CSS.
- **Radix UI**: Headless UI primitives for accessibility and logic.
- **Lucide React**: Beautiful & consistent icon set.
- **Next Themes**: Theming utility (Dark/Light mode support).

### Forms & Validation
- **React Hook Form**: Performant, flexible, and extensible forms with easy-to-use validation.
- **Zod 3.25**: TypeScript-first schema declaration and validation library.

### Visualization
- **Recharts**: Composable charting library built on React components.
- **React Flow** (if used for workflows, else remove): Node-based visualization.

### Utilities
- **date-fns**: Modern JavaScript date utility library.
- **Papa Parse**: Fast and powerful CSV parser.
- **XLSX**: Excel file parser.
- **jsPDF**: Client-side PDF generation.

## Backend (Serverless)

The backend relies entirely on **Supabase**, a comprehensive Firebase alternative.

### Core Services
- **PostgreSQL**: The world's most advanced open-source relational database.
- **Supabase Auth**: Authentication and user management (Email/Password, MFA).
- **Supabase Storage**: Secure file handling for uploads.
- **Supabase Edge Functions**: Serverless functions (Deno) for custom backend logic.
- **Supabase Realtime**: Listen to database changes in real-time.
- **Row Level Security (RLS)**: Fine-grained access control at the database level.

## AI & Machine Learning

- **Google Gemini API**: Large Language Model (LLM) for RAG-powered chat and analysis.
- **TensorFlow.js**: Machine learning models running directly in the browser (Client-side ML).
- **LangChain.js** (if used, else custom RAG): Framework for LLM applications.
- **pgvector**: PostgreSQL extension for vector similarity search (Embeddings).

## Testing

- **Vitest**: Blazing fast unit test framework powered by Vite.
- **Playwright**: Reliable end-to-end testing for modern web apps.
- **React Testing Library**: Simple and complete testing utilities that encourage good testing practices.

## DevOps & Tooling

- **ESLint**: Pluggable code analysis tool for identifying and reporting on patterns in JavaScript.
- **Prettier**: an opinionated code formatter.
- **Git**: Version control system.
- **GitHub**: Source code hosting and collaboration.
- **Vercel / Netlify**: Recommended/Supported platforms for frontend deployment.

## Key Decisions

- **Client-Side Heavy**: To maintain $0 operational costs, we leverage client-side processing (TensorFlow.js) and serverless backend (Supabase Free Tier).
- **Type Safety**: End-to-end type safety with TypeScript and Zod ensures robustness.
- **Component Reusability**: Shadcn UI provides a solid foundation for a consistent design system without the bloat of heavy component libraries.
