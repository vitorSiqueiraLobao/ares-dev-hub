-- Sample Query
-- Validação estrita: Apenas SELECTs autorizados pelo SQL Guard

SELECT 
    u.id AS user_id,
    u.name AS user_name,
    u.email AS user_email,
    l.event_type,
    l.created_at
FROM users u
INNER JOIN activity_logs l ON l.user_id = u.id
WHERE l.created_at >= CURRENT_DATE - 30
ORDER BY l.created_at DESC;
