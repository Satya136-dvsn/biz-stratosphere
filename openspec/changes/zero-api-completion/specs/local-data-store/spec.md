## Purpose

Provides a client-side reactive in-memory and LocalStorage persistence layer simulating Supabase PostgREST tables for offline operations.

## ADDED Requirements

### Requirement: Local PostgREST query simulation
The system SHALL provide query builder operations (select, insert, update, delete, eq, order, limit, single) backed by local storage.

#### Scenario: Querying datasets offline
- **WHEN** components request dataset records via the database client
- **THEN** the local data store returns matching records including pre-seeded sample data

### Requirement: LocalStorage persistence
The system SHALL synchronize user-created items such as chart configs, automation rules, and decisions across page refreshes.

#### Scenario: Saving a new decision or chart config
- **WHEN** a user creates a new record in offline mode
- **THEN** the record is stored in LocalStorage and retrieved on subsequent page visits
