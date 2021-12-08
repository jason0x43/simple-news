import { useContext } from "../deps.ts";
import ContextMenuContext from "../ContextMenuContext.tsx";

export default function useContextMenu() {
  return useContext(ContextMenuContext);
}
