import useUser from "./useUser.ts";
import { Feed } from '../../types.ts';

export default function useFeed(feedId: number): Feed | undefined {
  const { user } = useUser();
  const feedGroups = user?.config?.feedGroups;
  if (feedGroups) {
    for (const group of feedGroups) {
      for (const feed of group.feeds) {
        if (feed.id === feedId) {
          return feed;
        }
      }
    }
  }

  return undefined;
}
