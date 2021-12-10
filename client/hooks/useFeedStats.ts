import { useContext } from "../deps.ts";
import FeedStatsContext from "../contexts/FeedStatsContext.tsx";

export default function useFeedStats() {
  return useContext(FeedStatsContext);
}

