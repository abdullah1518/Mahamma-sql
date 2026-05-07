-- Create custom ENUM types
CREATE TYPE gig_status AS ENUM ('Open', 'In Progress', 'Completed', 'Cancelled');
CREATE TYPE proposal_status AS ENUM ('Pending', 'Accepted', 'Rejected', 'Withdrawn');
CREATE TYPE contract_status AS ENUM ('Active', 'Completed', 'Cancelled', 'Disputed');
CREATE TYPE milestone_status AS ENUM ('Pending', 'In Progress', 'Submitted', 'Approved', 'Rejected');
CREATE TYPE proficiency_level AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Expert');

-- 5.1 student
CREATE TABLE student (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    major VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL CHECK (email LIKE '%@%.%'),
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    rating DECIMAL(3,2) NOT NULL DEFAULT 0.00 CHECK (rating BETWEEN 0 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.2 skill
CREATE TABLE skill (
    skill_id SERIAL PRIMARY KEY,
    skill_name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL
);

-- 5.3 student_skill
CREATE TABLE student_skill (
    student_id INT REFERENCES student(id) ON DELETE CASCADE,
    skill_id INT REFERENCES skill(skill_id) ON DELETE CASCADE,
    proficiency_level proficiency_level NOT NULL,
    PRIMARY KEY (student_id, skill_id)
);

-- 5.4 gig
CREATE TABLE gig (
    gig_id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES student(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    budget DECIMAL(10,2) NOT NULL CHECK (budget > 0),
    deadline DATE NOT NULL,
    status gig_status NOT NULL DEFAULT 'Open',
    posted_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (deadline > posted_date)
);

-- 5.5 gig_skill
CREATE TABLE gig_skill (
    gig_id INT REFERENCES gig(gig_id) ON DELETE CASCADE,
    skill_id INT REFERENCES skill(skill_id) ON DELETE CASCADE,
    PRIMARY KEY (gig_id, skill_id)
);

-- 5.6 proposal
CREATE TABLE proposal (
    proposal_id SERIAL PRIMARY KEY,
    gig_id INT NOT NULL REFERENCES gig(gig_id) ON DELETE RESTRICT,
    freelancer_id INT NOT NULL REFERENCES student(id) ON DELETE RESTRICT,
    bid_amount DECIMAL(10,2) NOT NULL CHECK (bid_amount > 0),
    estimated_time INT NOT NULL CHECK (estimated_time > 0),
    cover_letter TEXT NULL,
    status proposal_status NOT NULL DEFAULT 'Pending',
    submitted_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.7 contract
CREATE TABLE contract (
    contract_id SERIAL PRIMARY KEY,
    proposal_id INT NOT NULL UNIQUE REFERENCES proposal(proposal_id) ON DELETE RESTRICT,
    status contract_status NOT NULL DEFAULT 'Active',
    agreed_amount DECIMAL(10,2) NOT NULL CHECK (agreed_amount > 0),
    start_date DATE NOT NULL,
    delivery_date DATE NOT NULL,
    completion_date DATE NULL
);

-- 5.8 milestone
CREATE TABLE milestone (
    milestone_id SERIAL PRIMARY KEY,
    contract_id INT NOT NULL REFERENCES contract(contract_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status milestone_status NOT NULL DEFAULT 'Pending'
);

-- 5.9 review
CREATE TABLE review (
    review_id SERIAL PRIMARY KEY,
    contract_id INT NOT NULL REFERENCES contract(contract_id) ON DELETE CASCADE,
    reviewer_id INT NOT NULL REFERENCES student(id) ON DELETE RESTRICT,
    reviewee_id INT NOT NULL REFERENCES student(id) ON DELETE RESTRICT,
    score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
    comment TEXT NULL,
    review_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (contract_id, reviewer_id),
    CHECK (reviewer_id <> reviewee_id)
);

-- Indexes
CREATE INDEX idx_student_skill_student ON student_skill(student_id);
CREATE INDEX idx_student_skill_skill ON student_skill(skill_id);
CREATE INDEX idx_gig_client ON gig(client_id);
CREATE INDEX idx_gig_skill_gig ON gig_skill(gig_id);
CREATE INDEX idx_gig_skill_skill ON gig_skill(skill_id);
CREATE INDEX idx_proposal_gig ON proposal(gig_id);
CREATE INDEX idx_proposal_freelancer ON proposal(freelancer_id);
CREATE INDEX idx_contract_proposal ON contract(proposal_id);
CREATE INDEX idx_milestone_contract ON milestone(contract_id);
CREATE INDEX idx_review_contract ON review(contract_id);
CREATE INDEX idx_review_reviewer ON review(reviewer_id);
CREATE INDEX idx_review_reviewee ON review(reviewee_id);

CREATE INDEX idx_gig_status ON gig(status);
CREATE INDEX idx_proposal_status ON proposal(status);
CREATE INDEX idx_contract_status ON contract(status);
CREATE INDEX idx_gig_posted_date ON gig(posted_date);
CREATE INDEX idx_gig_open_recent ON gig(posted_date DESC) WHERE status = 'Open';

-- Triggers and Functions

-- 8.1 update_student_rating()
CREATE OR REPLACE FUNCTION update_student_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE student
        SET rating = (
            SELECT COALESCE(ROUND(AVG(score)::numeric, 2), 0.00)
            FROM review
            WHERE reviewee_id = NEW.reviewee_id
        )
        WHERE id = NEW.reviewee_id;
    END IF;

    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.reviewee_id <> NEW.reviewee_id) THEN
        UPDATE student
        SET rating = (
            SELECT COALESCE(ROUND(AVG(score)::numeric, 2), 0.00)
            FROM review
            WHERE reviewee_id = OLD.reviewee_id
        )
        WHERE id = OLD.reviewee_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_student_rating
AFTER INSERT OR UPDATE OR DELETE ON review
FOR EACH ROW EXECUTE FUNCTION update_student_rating();

-- 8.2 set_updated_at()
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_student_updated_at
BEFORE UPDATE ON student
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_gig_updated_at
BEFORE UPDATE ON gig
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
