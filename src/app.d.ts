/// <reference types="@sveltejs/kit" />

declare namespace App {
  interface Session {
    id: import('$lib/db/schema').Session['id'];
    user: import('$lib/db/schema').User;
    data: import('$lib/db/schema').SessionData;
  }

  interface Locals {
    session?: import('$lib/db/session').SessionWithUser;
    sessionData: import('$lib/db/session').SessionData;
  }
}
