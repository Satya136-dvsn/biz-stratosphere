## Purpose

Enables the Biz Stratosphere analytics and AI platform to run 100% standalone without requiring external third-party APIs or cloud infrastructure.

## ADDED Requirements

### Requirement: Standalone execution without external APIs
The system SHALL operate in standalone mode when external API services or environment variables are unavailable.

#### Scenario: Running in standalone mode
- **WHEN** the application is launched without external Supabase or LLM API keys
- **THEN** all pages, charts, predictive tools, and admin interfaces remain interactive and functional without unhandled network exceptions

### Requirement: Demo Authentication Persona
The system SHALL provide an instant demo login mechanism granting authenticated administrative access in offline mode.

#### Scenario: 1-click Demo Login
- **WHEN** a user selects "Try Live Demo" or "Quick Demo Login"
- **THEN** the system logs the user in as a demo administrator and navigates to the dashboard without network authentication calls
