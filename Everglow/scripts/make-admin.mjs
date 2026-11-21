// Gives (or removes) access to the moderation space.
// Usage: npm run make-admin -- <username>          (add)
//        npm run make-admin -- <username> --remove (remove)
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const [username, flag] = process.argv.slice(2);
if (!username) {
  console.log("Usage : npm run make-admin -- <nom_utilisateur> [--remove]");
  process.exit(1);
}
const db = new DatabaseSync(path.join(process.cwd(), "data", "everglow.db"));
const res = db.prepare("UPDATE users SET is_admin = ? WHERE username = ?").run(flag === "--remove" ? 0 : 1, username.toLowerCase());
console.log(res.changes ? `✅ @${username} ${flag === "--remove" ? "n'est plus" : "est maintenant"} modérateur.` : `Aucun compte @${username}.`);
