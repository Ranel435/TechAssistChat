package queries

type MessageQueries struct{}

const (
	SaveMessageQuery = `
	INSERT INTO messages (from_user_id, to_user_id, from_user, to_user, message, created_at)
	VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
	RETURNING id, created_at`

	GetChatHistoryByUsernameQuery = `
	SELECT id, COALESCE(from_user_id, 0), COALESCE(to_user_id, 0), 
	       COALESCE(from_user, ''), COALESCE(to_user, ''), message, created_at
	FROM messages
	WHERE (from_user = $1 AND to_user = $2) OR (from_user = $2 AND to_user = $1)
	ORDER BY created_at ASC
	LIMIT $3`

	GetChatHistoryByIDQuery = `
	SELECT m.id, m.from_user_id, m.to_user_id, 
	       u1.username as from_user, u2.username as to_user,
	       m.message, m.created_at
	FROM messages m
	LEFT JOIN users u1 ON m.from_user_id = u1.id
	LEFT JOIN users u2 ON m.to_user_id = u2.id
	WHERE (m.from_user_id = $1 AND m.to_user_id = $2) OR (m.from_user_id = $2 AND m.to_user_id = $1)
	ORDER BY m.created_at ASC
	LIMIT $3`

	GetUserChatsByUsernameQuery = `
	SELECT DISTINCT 
		CASE 
			WHEN from_user = $1 THEN to_user 
			ELSE from_user 
		END as chat_partner
	FROM messages
	WHERE from_user = $1 OR to_user = $1
	ORDER BY chat_partner`

	GetUserChatsByIDQuery = `
	SELECT DISTINCT u.id, u.username, u.created_at, u.last_seen
	FROM users u
	JOIN messages m ON (u.id = m.from_user_id OR u.id = m.to_user_id)
	WHERE (m.from_user_id = $1 OR m.to_user_id = $1) AND u.id != $1
	ORDER BY u.username`
)
