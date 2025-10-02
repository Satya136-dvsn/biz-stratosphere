# Power BI + Supabase Setup

## How to Connect Power BI to Supabase (Postgres)

1. Get your Supabase Postgres connection string from the Supabase dashboard (Project Settings > Database > Connection string).
2. In Power BI Desktop, click "Get Data" > "PostgreSQL database".
3. Enter the host, database, username, and password from your Supabase connection string.
4. (Optional) Enable SSL if required by Supabase.
5. Load your tables (e.g., datasets, data_points) and build your dashboard.
6. To schedule refreshes, publish to Power BI Service and configure credentials.

## Tips
- Use DirectQuery for live data, or Import for faster performance.
- Document your dataset and dashboard in this folder.
