declare namespace App {
  interface Locals {
    user: import('$lib/db/schema').User | undefined;
    sessionId: import('$lib/db/schema').Session['id'] | undefined;
    sessionData: import('$lib/db/session').SessionData;
  }
}
