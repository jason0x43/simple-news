import { React, useContext, useMemo } from "../deps.ts";
import { getUser, login } from "../api.ts";
import { User } from "../../types.ts";

const UserContext = React.createContext<
  {
    user: User | undefined;
    fetchUser: () => void;
    login: (email: string, password: string) => void;
  }
>({ user: undefined, fetchUser: () => undefined, login: () => undefined });

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

    login: async (email: string, password: string) => {
      try {
        const user = await login(email, password);
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
