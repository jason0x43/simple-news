import { React, useContext } from "../deps.ts";
import { getUser } from '../api.ts';
import { User } from '../../types.ts';

const UserContext = React.createContext<
  { user: User | undefined; fetchUser: () => void }
>({ user: undefined, fetchUser: () => undefined });

export default UserContext;

export interface UserProviderProps {
  user?: User;
}

export const UserProvider: React.FC<UserProviderProps> = (props) => {
  const [user, setUser] = React.useState<User | undefined>(props.user);

  const fetchUser = async () => {
    try {
      const user = await getUser();
      setUser(user);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <UserContext.Provider value={{ user, fetchUser }}>
      {props.children}
    </UserContext.Provider>
  );
};

export function useUser() {
  return useContext(UserContext);
}
