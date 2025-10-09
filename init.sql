CREATE TABLE clients (
    client_id SERIAL PRIMARY KEY,
    initials VARCHAR(10) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(20),
    address TEXT,
    la_area VARCHAR(100),
    consent_flags JSONB,
    pseudonymised_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assessments (
    assessment_id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(client_id),
    assessor_id INTEGER,
    date TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    form_version VARCHAR(50),
    answers_json JSONB,
    attachments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE device_workflow_status AS ENUM (
    'Referral',
    'Triage',
    'Assessment',
    'Device Approval',
    'Procurement',
    'Installation',
    'Review',
    'Maintenance'
);

CREATE TABLE assistive_devices (
    device_id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(client_id),
    device_type VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255),
    status device_workflow_status NOT NULL DEFAULT 'Referral',
    warranty_expires_on DATE,
    installer_id INTEGER,
    pamms_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE care_plan_status AS ENUM ('Draft', 'Active', 'Completed', 'Cancelled');

CREATE TABLE care_plans (
    care_plan_id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(client_id),
    start_date DATE NOT NULL,
    end_date DATE,
    status care_plan_status NOT NULL DEFAULT 'Draft',
    assigned_provider_id INTEGER,
    review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE care_plan_actions (
    action_id SERIAL PRIMARY KEY,
    care_plan_id INTEGER REFERENCES care_plans(care_plan_id) ON DELETE CASCADE,
    goal_description TEXT NOT NULL,
    action_details TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    target_date DATE
);

CREATE TYPE user_role AS ENUM ('assessor', 'manager', 'coordinator', 'admin');

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert a few sample users for testing
INSERT INTO users (email, hashed_password, role, full_name) VALUES
('manager@care.com', '$2b$12$EixZa.Asd.s.s3.Ew2F.d.2j.X3p.Y3p.Z3p.X3p.Y3p.Z3', 'manager', 'Maria Manager'),
('assessor@care.com', '$2b$12$EixZa.Asd.s.s3.Ew2F.d.2j.X3p.Y3p.Z3p.X3p.Y3p.Z3', 'assessor', 'Andy Assessor');