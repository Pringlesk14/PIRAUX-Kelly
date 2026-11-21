import { DatabaseSync, type StatementSync } from "node:sqlite";

type SQLInputValue = null | number | bigint | string | Uint8Array;
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");

const SCHEMA = fs.readFileSync(path.join(process.cwd(), "lib", "schema.sql"), "utf8");

// node:sqlite returns null-prototype rows, which React refuses to pass to the
// browser, so every row is copied into a plain object.
const plain = <T,>(row: T) => (row ? ({ ...row } as T) : row);

class Statement {
  constructor(private stmt: StatementSync) {}
  get(...params: SQLInputValue[]) { return plain(this.stmt.get(...params)); }
  all(...params: SQLInputValue[]) { return this.stmt.all(...params).map(plain); }
  run(...params: SQLInputValue[]) { return this.stmt.run(...params); }
}

const globalForDb = globalThis as unknown as { __everglowDb?: DatabaseSync };

export function db() {
  return { prepare: (sql: string) => new Statement(conn().prepare(sql)), exec: (sql: string) => conn().exec(sql) };
}

// Adds columns to tables created by an earlier version of Everglow.
function migrate(conn: DatabaseSync) {
  const postCols = (conn.prepare("PRAGMA table_info(posts)").all() as { name: string }[]).map((c) => c.name);
  if (postCols.length > 0 && !postCols.includes("challenge_day")) conn.exec("ALTER TABLE posts ADD COLUMN challenge_day TEXT;");
  if (postCols.length > 0 && !postCols.includes("duo_media"))
    conn.exec("ALTER TABLE posts ADD COLUMN duo_partner_id INTEGER REFERENCES users(id) ON DELETE SET NULL; ALTER TABLE posts ADD COLUMN duo_media TEXT;");
  const userCols = (conn.prepare("PRAGMA table_info(users)").all() as { name: string }[]).map((c) => c.name);
  if (userCols.length > 0 && !userCols.includes("banned_at"))
    conn.exec(`ALTER TABLE users ADD COLUMN birthdate TEXT;
      ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN banned_at INTEGER;`);
  const cols = (conn.prepare("PRAGMA table_info(messages)").all() as { name: string }[]).map((c) => c.name);
  if (cols.length > 0 && !cols.includes("kind")) {
    conn.exec(`ALTER TABLE messages ADD COLUMN kind TEXT NOT NULL DEFAULT 'text';
      ALTER TABLE messages ADD COLUMN media TEXT;
      ALTER TABLE messages ADD COLUMN media_kind TEXT;
      ALTER TABLE messages ADD COLUMN opened_at INTEGER;`);
  }
}

function conn(): DatabaseSync {
  if (!globalForDb.__everglowDb) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const conn = new DatabaseSync(path.join(DATA_DIR, "everglow.db"));
    conn.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    migrate(conn);
    conn.exec(SCHEMA);
    globalForDb.__everglowDb = conn;
  }
  return globalForDb.__everglowDb;
}

export type User = {
  id: number;
  username: string;
  display_name: string;
  bio: string;
  avatar: string | null;
  is_admin: number;
};

export type FeedPost = {
  id: number;
  kind: "video" | "photo";
  media: string;
  caption: string;
  created_at: number;
  user_id: number;
  username: string;
  display_name: string;
  avatar: string | null;
  like_count: number;
  comment_count: number;
  liked: number;
  challenge_day: string | null;
  /** Moitié-moitié: the right half and who took it (null for a single photo). */
  duo_media: string | null;
  partner_username: string | null;
};

/** Posts with author, counts and whether `viewerId` liked them. */
export function listPosts(viewerId: number, where: string, params: (string | number)[], limit = 50, order = "p.created_at DESC"): FeedPost[] {
  const hidden = hiddenIds(viewerId);
  return db()
    .prepare(
      `SELECT p.id, p.kind, p.media, p.caption, p.created_at, p.user_id, p.challenge_day, p.duo_media, pu.username AS partner_username,
              u.username, u.display_name, u.avatar,
              (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
              EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked
         FROM posts p JOIN users u ON u.id = p.user_id LEFT JOIN users pu ON pu.id = p.duo_partner_id
        WHERE (${where})
          AND p.user_id NOT IN (${hidden}) AND (p.duo_partner_id IS NULL OR p.duo_partner_id NOT IN (${hidden}))
        ORDER BY ${order}
        LIMIT ${limit}`,
    )
    .all(viewerId, ...params) as unknown as FeedPost[];
}

/**
 * Ids of the people `viewerId` must not see: those they blocked, those who blocked them,
 * and suspended accounts. Returned as a comma-separated list of integers for `NOT IN (...)`.
 */
export function hiddenIds(viewerId: number): string {
  const rows = db()
    .prepare(
      `SELECT blocked_id AS id FROM blocks WHERE blocker_id = ?
       UNION SELECT blocker_id FROM blocks WHERE blocked_id = ?
       UNION SELECT id FROM users WHERE banned_at IS NOT NULL`,
    )
    .all(viewerId, viewerId) as { id: number }[];
  return rows.length ? rows.map((r) => Number(r.id)).join(",") : "-1";
}

/** True if either person blocked the other, or one of them is suspended. */
export function isBlocked(a: number, b: number): boolean {
  return !!db()
    .prepare(
      `SELECT 1 FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)
       UNION SELECT 1 FROM users WHERE id IN (?, ?) AND banned_at IS NOT NULL`,
    )
    .get(a, b, b, a, a, b);
}
