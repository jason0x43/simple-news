import { useContext } from "../deps.ts";
import UserContext from "../UserContext.tsx";

export default function useUser() {
  return useContext(UserContext);
}
