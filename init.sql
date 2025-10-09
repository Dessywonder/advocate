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