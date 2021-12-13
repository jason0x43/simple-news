import { React } from "../deps.ts";
import { UserProvider } from "./UserContext.tsx";
import { ArticlesProvider } from "./ArticlesContext.tsx";
import { ContextMenuProvider } from "./ContextMenuContext.tsx";
import { Settings, SettingsProvider } from "./SettingsContext.tsx";
import { FeedsProvider } from "./FeedsContext.tsx";
import { Article, FeedStats, User } from "../../types.ts";

export interface ContextProps {
  user?: User;
  selectedFeeds?: number[];
  articles?: Article[];
  feedStats?: FeedStats;
}

export const ContextContainer: React.FC<ContextProps> = (props) => {
  return (
    <UserProvider user={props.user}>
      <SettingsProvider>
        <FeedsProvider
          feedStats={props.feedStats}
          selectedFeeds={props.selectedFeeds}
        >
          <ArticlesProvider articles={props.articles}>
            <ContextMenuProvider>
              {props.children}
            </ContextMenuProvider>
          </ArticlesProvider>
        </FeedsProvider>
      </SettingsProvider>
    </UserProvider>
  );
};

export { useUser } from "./UserContext.tsx";
export { useArticles } from "./ArticlesContext.tsx";
export { useContextMenu } from "./ContextMenuContext.tsx";
export { useSettings } from "./SettingsContext.tsx";
export { useFeeds } from "./FeedsContext.tsx";

export type { Settings };
