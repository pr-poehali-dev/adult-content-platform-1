ALTER TABLE t_p71282790_adult_content_platfo.users 
ADD COLUMN role VARCHAR(20) DEFAULT NULL;

COMMENT ON COLUMN t_p71282790_adult_content_platfo.users.role IS 'User role: viewer or creator';