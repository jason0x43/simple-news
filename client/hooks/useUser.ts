import { useContext } from "../deps.ts";
import UserContext from "../contexts/UserContext.tsx";

export default function useUser() {
  return useContext(UserContext);
}
