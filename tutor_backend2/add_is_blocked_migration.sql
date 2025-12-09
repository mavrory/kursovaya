-- Add is_blocked column to user table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'is_blocked') THEN
        ALTER TABLE "user" ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE;
        CREATE INDEX idx_user_is_blocked ON "user"(is_blocked);
        RAISE NOTICE 'Column is_blocked added to user table.';
    ELSE
        RAISE NOTICE 'Column is_blocked already exists in user table.';
    END IF;
END
$$;

