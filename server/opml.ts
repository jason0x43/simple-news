import { log, parseXml } from "./deps.ts";
import {
  addFeed,
  getFeed,
  getFeedByUrl,
  getUserByEmail,
  updateUserConfig,
} from "./database/mod.ts";

type OpmlFeed = {
  "@title": string;
  "@xmlUrl": string;
  "@text": string;
  "@htmlUrl": string;
  "@type": string;
  "#text": null;
};

type OpmlData = {
  opml: {
    "@version": number;
    head: {
      title: string;
    };
    body: {
      outline: {
        "@text": string;
        "@title": string;
        outline: OpmlFeed | OpmlFeed[];
      }[];
    };
  };
};

export type ImportOptions = {
  email: string;
  file: string;
};

export async function importOpmlFile(
  { email, file }: ImportOptions,
) {
  log.info(`Importing OPML file ${file} for ${email}`);
  const feedsText = await Deno.readTextFile(file);
  const feeds = parseXml(feedsText) as unknown as OpmlData;

  const groups = [];
  for (const group of feeds.opml.body.outline) {
    groups.push({
      title: group["@title"],
      feeds: Array.isArray(group.outline)
        ? group.outline.map((item) => ({
          title: item["@title"],
          url: item["@xmlUrl"],
          htmlUrl: item["@htmlUrl"],
          type: item["@type"],
        }))
        : [{
          title: group.outline["@title"],
          url: group.outline["@xmlUrl"],
          htmlUrl: group.outline["@htmlUrl"],
          type: group.outline["@type"],
        }],
    });
  }

  const user = getUserByEmail(email);
  if (!user) {
    throw new Error(`No user with email "${email}"`);
  }

  log.debug(`Importing OPML for ${user.email} (${user.id})`);

  const config = {
    ...user.config,
    feedGroups: user.config?.feedGroups?.slice() ?? [],
  };

  config.feedGroups = config.feedGroups.filter((group) => group.title);

  for (const group of groups) {
    const index = config.feedGroups.findIndex((grp) =>
      grp.title === group.title
    );
    const feeds: number[] = [];
    if (index === -1) {
      config.feedGroups.push({
        title: group.title,
        feeds,
      });
    } else {
      feeds.push(...config.feedGroups[index].feeds);
      config.feedGroups[index] = {
        ...config.feedGroups[index],
        feeds,
      };
    }

    for (const feed of group.feeds) {
      const dbFeed = getFeedByUrl(feed.url) ?? addFeed(feed);
      if (!feeds.indexOf(dbFeed.id)) {
        feeds.push(dbFeed.id);
        log.debug(`Added ${dbFeed.id} to user feed group ${group.title}`);
      }
    }
  }

  if (JSON.stringify(config) !== JSON.stringify(user.config)) {
    updateUserConfig(user.id, config);
  }
}

export async function exportOpmlFile(
  { email, file }: ImportOptions,
) {
  log.info(`Exporting OPML to ${file} for ${email}`);
  const user = getUserByEmail(email);
  if (!user) {
    throw new Error(`No user with email "${email}"`);
  }

  if (!user.config?.feedGroups) {
    log.warning(`User has no feeds configured`);
    return;
  }

  const xml = ['<?xml version="1.0" encoding="UTF-8"?>'];
  xml.push('<opml version="2.0">');
  xml.push("<head>");
  xml.push("<title>Feeds</title>");
  xml.push("</head>");
  xml.push("<body>");

  for (const group of user.config.feedGroups!) {
    xml.push(`<outline title="${group.title}" text="${group.title}">`);

    for (const feed of group.feeds) {
      const dbFeed = getFeed(feed);
      xml.push(
        `<outline title="${dbFeed.title}" xmlUrl="${dbFeed.url}" ` +
          `text="${dbFeed.title}" htmlUrl="${dbFeed.htmlUrl}" ` +
          `type="${dbFeed.type}" />`,
      );
    }

    xml.push("</outline>");
  }

  xml.push("</body>");
  xml.push("</opml>");

  await Deno.writeTextFile(file, xml.join("\n"));
}
