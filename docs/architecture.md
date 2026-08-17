# SGE DataHub Architecture

The SGE DataHub operates on a robust, multi-tenant architecture designed to manage multiple disconnected systems safely and securely through one central control plane. 

Here is the single-line diagram explaining how it all connects:

```mermaid
graph TD
    %% Core Infrastructure Layer
    subgraph "Core Infrastructure"
        Cloudflare[Cloudflare Network Edge]
        VPS[(PostgreSQL VPS Instance)]
    end

    %% Routing Layer
    subgraph "SGE DataHub (Control Plane)"
        SGE_UI[SGE Cloud Web App]
        Resolver{Database Connection Resolver}
    end

    %% Project/Database Layer
    subgraph "VPS Physical Databases"
        DB_Control[(sge_datahub)]
        DB_AMC[(amcmep)]
        DB_WOH[(workofhuman)]
    end

    %% User Interaction
    Users([Users & Admins]) -->|HTTPS| Cloudflare
    Cloudflare -->|Vercel / Edge| SGE_UI

    %% Auth & Routing Flow
    SGE_UI -->|1. Authenticate against| DB_Control
    SGE_UI -->|2. Query user's accessible databases| DB_Control
    
    %% Dynamic Resolution
    SGE_UI -->|3. Request connection to specific DB| Resolver
    Resolver -->|If 'amcmep'| DB_AMC
    Resolver -->|If 'workofhuman'| DB_WOH
    Resolver -->|If 'sge_datahub'| DB_Control

    %% Styling
    classDef default fill:#111827,stroke:#374151,color:#f3f4f6
    classDef db fill:#064e3b,stroke:#047857,color:#fff
    classDef ui fill:#312e81,stroke:#4338ca,color:#fff
    
    class DB_Control,DB_AMC,DB_WOH db
    class SGE_UI,Resolver ui
```

### Explanation of the Flow

1. **Authentication:** When a user visits `cloud.sge.amcmep.in`, the UI connects to the `sge_datahub` database. This database stores the `platform_users`, `platform_projects`, and `platform_databases` tables.
2. **Access Control:** The system checks which projects the user is authorized for and pulls the list of databases they are allowed to see.
3. **Dynamic Resolution:** When you select a database in the UI (like `amcmep`), the backend dynamically changes the connection string by substituting the database name into the URL (`postgresql://user:pass@host:5432/amcmep`), and securely proxies the query into that specific physical database.
4. **Isolation:** The apps (AMC MEP and WorkOfHuman) are physically segregated. WorkOfHuman data is completely inaccessible to AMC MEP users, but an admin logging into the overarching `sge_datahub` control plane can securely manage both from one interface.
