package queries

type UserQueries struct{}

const (
	CreateUserQuery = `
	INSERT INTO users (username, password_hash, created_at, last_seen)
	VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	RETURNING id, created_at, last_seen`

	GetUserByUsernameQuery = `
	SELECT id, username, password_hash, created_at, last_seen
	FROM users
	WHERE username = $1`

	GetUserByIDQuery = `
	SELECT id, username, password_hash, created_at, last_seen
	FROM users
	WHERE id = $1`

	UpdateLastSeenQuery = `
	UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = $1`
)
