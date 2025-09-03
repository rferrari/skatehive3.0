-- Join requests table for users who want to join Skatehive
CREATE TABLE join_requests (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    username_1 VARCHAR(16) NOT NULL,
    username_2 VARCHAR(16),
    username_3 VARCHAR(16),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    created_by VARCHAR(255), -- Hive username of who created the account
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Indexes for faster lookups
CREATE INDEX idx_join_requests_status ON join_requests(status);
CREATE INDEX idx_join_requests_email ON join_requests(email);
CREATE INDEX idx_join_requests_created_at ON join_requests(created_at);
CREATE INDEX idx_join_requests_created_by ON join_requests(created_by);
