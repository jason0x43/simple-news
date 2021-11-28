import { log } from "../../deps.ts";
import { query } from './db.ts';
import { getFeed } from './feeds.ts';
import { User, UserConfig } from '../../types.ts';

type UserRow = [number, string, string, string?];

type DehydratedFeedGroup = Omit<UserConfig['feedGroups'][0], 'feeds'> & { feeds:
  number[] };

type DehydratedConfig = Omit<UserConfig, 'feedGroups'> & {
  feedGroups: DehydratedFeedGroup[];
}

function hydrateConfig(config: DehydratedConfig): UserConfig {
  return {
    ...config,
    feedGroups: config.feedGroups.map((group) => ({
      ...group,
      feeds: group.feeds.map(getFeed)
    }))
  };
}

function dehydrateConfig(config: UserConfig): DehydratedConfig {
  return {
    ...config,
    feedGroups: config.feedGroups.map((group) => ({
      ...group,
      feeds: group.feeds.map(({ id }) => id)
    }))
  };
}

function rowToUser(row: UserRow): User {
  const [id, email, name, rawConfig] = row;
  const config = rawConfig ? hydrateConfig(JSON.parse(rawConfig)) : undefined;
  return { id, name, email, config };
}

export function addUser(user: Omit<User, "id" | "config">): User {
  const rows = query<UserRow>(
    `INSERT INTO users (name, email)
    VALUES (:name, :email)
    RETURNING *`,
    user,
  );
  return rowToUser(rows[0]);
}

export function getUserByEmail(email: string): User {
  const rows = query<UserRow>(
    "SELECT * FROM users WHERE email = (?)",
    [email],
  );
  if (!rows[0]) {
    throw new Error(`No user with email ${email}`);
  }
  return rowToUser(rows[0]);
}

export function updateUserConfig(userId: number, config: UserConfig) {
  const dbConfig = JSON.stringify(dehydrateConfig(config));
  query(
    "UPDATE users SET config = (json(:config)) WHERE id = (:userId)",
    {
      config: dbConfig,
      userId,
    },
  );
  log.debug(`Set config for user ${userId} to ${dbConfig}`);
}
