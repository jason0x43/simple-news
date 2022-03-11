import * as bcrypt from "bcrypt";
import * as log from "std/log/mod.ts";
import { query } from "./db.ts";
import { User, UserConfig } from "../../types.ts";
import { createRowHelpers, select } from "./util.ts";

type DbUser = Omit<User, "config"> & {
  config?: string;
};

const {
  columns: userColumns,
  query: userQuery,
} = createRowHelpers<
  DbUser
>()(
  "id",
  "email",
  "config",
  "username"
);

function toUser(dbUser: DbUser) {
  return {
    ...dbUser,
    config: dbUser.config ? JSON.parse(dbUser.config) : undefined,
  };
}

export function addUser(
  user: Pick<User, "username" | "email">,
  password: string,
): User {
  const hashedPassword = bcrypt.hashSync(password);
  return toUser(
    userQuery(
      `INSERT INTO users (username, email, password)
    VALUES (:username, :email, :password)
    RETURNING ${userColumns}`,
      { username: user.username, email: user.email, password: hashedPassword },
    )[0],
  );
}

export function getUser(userId: number): User {
  const user = userQuery(
    `SELECT ${userColumns} FROM users WHERE id = (:userId)`,
    { userId },
  )[0];
  if (!user) {
    throw new Error(`No user with id ${userId}`);
  }
  return toUser(user);
}

export function getUserByEmail(email: string): User {
  const user = userQuery(
    `SELECT ${userColumns} FROM users WHERE email = (:email)`,
    { email },
  )[0];
  if (!user) {
    throw new Error(`No user with email ${email}`);
  }
  return toUser(user);
}

export function getUserByUsername(username: string): User {
  const user = userQuery(
    `SELECT ${userColumns} FROM users WHERE username = (:username)`,
    { username },
  )[0];
  if (!user) {
    throw new Error(`No user with username ${username}`);
  }
  return toUser(user);
}

export function updateUserConfig(userId: number, config: UserConfig) {
  const dbConfig = JSON.stringify(config);
  query(
    "UPDATE users SET config = (json(:config)) WHERE id = (:userId)",
    { config: dbConfig, userId },
  );
  log.debug(`Set config for user ${userId} to ${dbConfig}`);
}

export function updateUserPassword(userId: number, password: string): void {
  const hashedPassword = bcrypt.hashSync(password);
  query(
    "UPDATE users SET password = (:password) WHERE id = (:userId)",
    { password: hashedPassword, userId },
  );
}

export function isUserPassword(userId: number, password: string): boolean {
  const userPassword = select(
    "SELECT password FROM users WHERE id = (:userId)",
    (row) => row[0] as string,
    { userId },
  )[0];
  if (!userPassword) {
    throw new Error(`No user with id ${userId}`);
  }
  return bcrypt.compareSync(password, userPassword);
}
