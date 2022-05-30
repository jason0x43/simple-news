import type { ActionFunction } from '@remix-run/node';
import { commitSession, getSession } from '~/session.server';

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const appStateStr = formData.get('appState') as string;
  const appState = JSON.parse(appStateStr);
  const session = await getSession(request);
  session.set('appState', appState);
  await commitSession(session);
  return appState;
};
