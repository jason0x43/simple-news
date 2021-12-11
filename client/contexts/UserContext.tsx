import { React, useContext, useMemo } from "../deps.ts";
import { getUser } from "../api.ts";
import { User } from "../../types.ts";

const UserContext = React.createContext<
  { user: User | undefined; fetchUser: () => void }
>({ user: undefined, fetchUser: () => undefined });

export default UserContext;

export interface UserProviderProps {
  user?: User;
}

export const UserProvider: React.FC<UserProviderProps> = (props) => {
  const [user, setUser] = React.useState<User | undefined>(props.user);

  const value = useMemo(() => ({
    user,

    fetchUser: async () => {
      try {
        const user = await getUser();
        setUser(user);
      } catch (error) {
        console.error(error);
      }
    },
  }), [user]);

  return (
    <UserContext.Provider value={value}>
      {props.children}
    </UserContext.Provider>
  );
};

export function useUser() {
  return useContext(UserContext);
}
