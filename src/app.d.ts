/// <reference types="@sveltejs/kit" />

declare namespace App {
  interface Session {
    id: import('@prisma/client').Session['id'];
    user: import('@prisma/client').User;
    data: import('$lib/db/session').SessionData;
  }

  interface Locals {
    session?: import('$lib/db/session').SessionWithUser;
    sessionData: import('$lib/db/session').SessionData;
  }
}
