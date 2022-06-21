import Parser from 'rss-parser';

export async function downloadFeed(url: string) {
  const aborter = new AbortController();
  const abortTimer = setTimeout(() => aborter.abort(), 10000);
  const response = await fetch(url, { signal: aborter.signal });
  clearTimeout(abortTimer);

  if (response.status !== 200) {
    throw new Error(`Error downloading feed: ${response.status}`);
  }

  const xml = await response.text();
  if (xml.length === 0) {
    throw new Error(`Error downloading feed: empty body`);
  }

  const parser = new Parser();
  return parser.parseString(xml);
}
