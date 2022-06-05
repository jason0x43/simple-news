import {
  json,
  redirect,
  type ActionFunction,
  type LoaderFunction,
  type MetaFunction,
} from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { useEffect, useRef } from 'react';
import Button from '~/components/Button';
import Input from '~/components/Input';
import { verifyLogin } from '~/models/user.server';
import {
  createUserSession,
  getSession,
  sessionStorage,
} from '~/session.server';
import styles from '../styles/login.css';

export function links() {
  return [{ rel: 'stylesheet', href: styles }];
}

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request);
  let resInit: ResponseInit | undefined;
  if (session) {
    resInit = {
      headers: {
        'Set-Cookie': await sessionStorage.destroySession(session),
      },
    };
  }
  return json({}, resInit);
};

type ActionData = {
  errors?: {
    username?: string;
    password?: string;
  };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const username = formData.get('username');
  const password = formData.get('password');
  const redirectTo = '/reader';

  if (typeof username !== 'string' || username.length === 0) {
    return json<ActionData>(
      { errors: { username: 'Username is invalid' } },
      { status: 400 }
    );
  }

  if (typeof password !== 'string' || password.length === 0) {
    return json<ActionData>(
      { errors: { password: 'Password is required' } },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return json<ActionData>(
      { errors: { password: 'Password is too short' } },
      { status: 400 }
    );
  }

  const user = await verifyLogin(username, password);

  if (!user) {
    return json<ActionData>(
      { errors: { username: 'Invalid username or password' } },
      { status: 400 }
    );
  }

  return createUserSession({
    request,
    userId: user.id,
    redirectTo,
  });
};

export const meta: MetaFunction = () => {
  return {
    title: 'Login',
  };
};

export default function LoginPage() {
  const actionData = useActionData<ActionData>();
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData?.errors?.username) {
      usernameRef.current?.focus();
    } else if (actionData?.errors?.password) {
      passwordRef.current?.focus();
    }
  }, [actionData]);

  return (
    <Form method="post" className="Login">
      <Input name="username" placeholder="Username" />
      <Input name="password" placeholder="Password" type="password" />
      <Button type="submit" label="Login" />
      {actionData?.errors?.username && (
        <div id="username-error">{actionData.errors.username}</div>
      )}
      {actionData?.errors?.password && (
        <div id="password-error">{actionData.errors.password}</div>
      )}
    </Form>
  );
}
