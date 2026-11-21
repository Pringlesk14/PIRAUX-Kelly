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
};

/** Posts with author, counts and whether `viewerId` liked them. */
export function listPosts(viewerId: number, where: string, params: (string | number)[], limit = 50, order = "p.created_at DESC"): FeedPost[] {
  return db()
    .prepare(
      `SELECT p.id, p.kind, p.media, p.caption, p.created_at, p.user_id, p.challenge_day,
              u.username, u.display_name, u.avatar,
              (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
              EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?) AS liked
         FROM posts p JOIN users u ON u.id = p.user_id
        WHERE ${where}
        ORDER BY ${order}
        LIMIT ${limit}`,
    )
    .all(viewerId, ...params) as unknown as FeedPost[];
}
