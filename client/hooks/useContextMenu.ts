import { useContext } from "../deps.ts";
import ContextMenuContext from "../contexts/ContextMenuContext.tsx";

export default function useContextMenu() {
  return useContext(ContextMenuContext);
}
