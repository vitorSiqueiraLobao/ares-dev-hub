import test from 'node:test';
import assert from 'node:assert';
import { sqlGuard } from './sql_guard.js';

test('SqlGuard - Validates pure SELECT', () => {
  const query = 'SELECT id, name, email FROM users WHERE active = 1';
  const result = sqlGuard.validate(query);
  assert.strictEqual(result.valid, true);
});

test('SqlGuard - Validates WITH ... SELECT (CTE)', () => {
  const query = 'WITH recent_events AS (SELECT user_id, MAX(created_at) as last_seen FROM activity_logs GROUP BY user_id) SELECT * FROM recent_events';
  const result = sqlGuard.validate(query);
  assert.strictEqual(result.valid, true);
});

test('SqlGuard - Blocks INSERT INTO', () => {
  const query = "INSERT INTO users (name) VALUES ('Hacker Test')";
  const result = sqlGuard.validate(query);
  assert.strictEqual(result.valid, false);
  assert.match(result.reason || '', /Apenas SELECT é permitido|Instrução potencialmente perigosa/i);
});

test('SqlGuard - Blocks UPDATE', () => {
  const query = "UPDATE users SET status = 'INACTIVE' WHERE id = 10";
  const result = sqlGuard.validate(query);
  assert.strictEqual(result.valid, false);
});

test('SqlGuard - Blocks DROP TABLE', () => {
  const query = 'DROP TABLE users';
  const result = sqlGuard.validate(query);
  assert.strictEqual(result.valid, false);
});

test('SqlGuard - Blocks multi-statement SQL injection (SELECT followed by DROP)', () => {
  const query = 'SELECT * FROM users; DROP TABLE logs;';
  const result = sqlGuard.validate(query);
  assert.strictEqual(result.valid, false);
});

test('SqlGuard - Injects safety limit if absent', () => {
  const query = 'SELECT * FROM users';
  const limited = sqlGuard.applySafetyLimit(query, 50);
  assert.strictEqual(limited, 'SELECT * FROM users LIMIT 50');
});

test('SqlGuard - Preserves existing limit', () => {
  const query = 'SELECT * FROM users LIMIT 10';
  const limited = sqlGuard.applySafetyLimit(query, 50);
  assert.strictEqual(limited, 'SELECT * FROM users LIMIT 10');
});
