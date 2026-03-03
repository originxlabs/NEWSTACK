-- Insert admin user for OriginXLabs@gmail.com
INSERT INTO admin_users (email, role) 
VALUES ('OriginXLabs@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';
