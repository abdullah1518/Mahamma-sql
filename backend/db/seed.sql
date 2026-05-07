-- Seed data for Mahamma Platform

-- Students
INSERT INTO student (name, major, email, password_hash, phone) VALUES
('Abdullah', 'ICS', 'abdullah@kfupm.edu.sa', '$2a$10$YVO8qk6vErSMb6Z0taoioeeXixn0YydUNWC3OUpLzIb/n8aXsY4yC', '0501111111'),
('Ayman', 'COE', 'ayman@kfupm.edu.sa', '$2a$10$YVO8qk6vErSMb6Z0taoioeeXixn0YydUNWC3OUpLzIb/n8aXsY4yC', '0502222222'),
('Anas', 'SWE', 'anas@kfupm.edu.sa', '$2a$10$YVO8qk6vErSMb6Z0taoioeeXixn0YydUNWC3OUpLzIb/n8aXsY4yC', '0503333333'),
('Mohammed', 'EE', 'mohammed@kfupm.edu.sa', '$2a$10$YVO8qk6vErSMb6Z0taoioeeXixn0YydUNWC3OUpLzIb/n8aXsY4yC', '0504444444');

-- Skills
INSERT INTO skill (skill_name, category) VALUES
('React', 'Programming'),
('Node.js', 'Programming'),
('PostgreSQL', 'Programming'),
('Figma', 'Design'),
('Physics Tutoring', 'Academic');

-- Student Skills
INSERT INTO student_skill (student_id, skill_id, proficiency_level) VALUES
((SELECT id FROM student WHERE name = 'Abdullah'), (SELECT skill_id FROM skill WHERE skill_name = 'React'), 'Expert'),
((SELECT id FROM student WHERE name = 'Ayman'), (SELECT skill_id FROM skill WHERE skill_name = 'Node.js'), 'Advanced'),
((SELECT id FROM student WHERE name = 'Anas'), (SELECT skill_id FROM skill WHERE skill_name = 'PostgreSQL'), 'Intermediate'),
((SELECT id FROM student WHERE name = 'Mohammed'), (SELECT skill_id FROM skill WHERE skill_name = 'Physics Tutoring'), 'Expert');

-- Gigs
INSERT INTO gig (client_id, title, description, budget, deadline, status) VALUES
((SELECT id FROM student WHERE name = 'Mohammed'), 'Build a simple website', 'Need a React frontend for my project', 500.00, CURRENT_DATE + INTERVAL '14 days', 'Open'),
((SELECT id FROM student WHERE name = 'Anas'), 'Database Help', 'Need help setting up a PostgreSQL schema', 300.00, CURRENT_DATE + INTERVAL '7 days', 'Open');

-- Gig Skills
INSERT INTO gig_skill (gig_id, skill_id) VALUES
((SELECT gig_id FROM gig WHERE title = 'Build a simple website'), (SELECT skill_id FROM skill WHERE skill_name = 'React')),
((SELECT gig_id FROM gig WHERE title = 'Database Help'), (SELECT skill_id FROM skill WHERE skill_name = 'PostgreSQL'));

-- Proposals
INSERT INTO proposal (gig_id, freelancer_id, bid_amount, estimated_time, cover_letter, status) VALUES
((SELECT gig_id FROM gig WHERE title = 'Build a simple website'), (SELECT id FROM student WHERE name = 'Abdullah'), 450.00, 10, 'I can build this fast', 'Pending'),
((SELECT gig_id FROM gig WHERE title = 'Database Help'), (SELECT id FROM student WHERE name = 'Anas'), 250.00, 5, 'I know postgres well', 'Pending');
