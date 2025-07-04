package queries

type MigrationQueries struct{}

const (
	CreateUsersTableQuery = `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`

	CreateUsersIndexesQuery = `
	CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
	CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users (last_seen);`

	CreateMessagesTableQuery = `
	CREATE TABLE IF NOT EXISTS messages (
		id SERIAL PRIMARY KEY,
		from_user VARCHAR(255), 
		to_user VARCHAR(255),   
		message TEXT NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`

	AddUserIdColumnsQuery = `
	ALTER TABLE messages 
	ADD COLUMN IF NOT EXISTS from_user_id INTEGER,
	ADD COLUMN IF NOT EXISTS to_user_id INTEGER;`

	AddForeignKeysQuery = `
	DO $$ 
	BEGIN
		IF NOT EXISTS (
			SELECT 1 FROM information_schema.table_constraints 
			WHERE constraint_name = 'messages_from_user_id_fkey' 
			AND table_name = 'messages'
		) THEN
			ALTER TABLE messages 
			ADD CONSTRAINT messages_from_user_id_fkey 
			FOREIGN KEY (from_user_id) REFERENCES users(id);
		END IF;

		IF NOT EXISTS (
			SELECT 1 FROM information_schema.table_constraints 
			WHERE constraint_name = 'messages_to_user_id_fkey' 
			AND table_name = 'messages'
		) THEN
			ALTER TABLE messages 
			ADD CONSTRAINT messages_to_user_id_fkey 
			FOREIGN KEY (to_user_id) REFERENCES users(id);
		END IF;
	END $$;`

	CreateMessagesIndexesQuery = `
	CREATE INDEX IF NOT EXISTS idx_messages_from_user_id ON messages (from_user_id);
	CREATE INDEX IF NOT EXISTS idx_messages_to_user_id ON messages (to_user_id);
	CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages (from_user);
	CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages (to_user);
	CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);`
)
