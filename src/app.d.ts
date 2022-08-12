/// <reference types="@sveltejs/kit" />

declare namespace App {
  interface Session {
    id: import('@prisma/client').Session['id'];
    user: import('@prisma/client').User;
  }

  interface Locals {
    session?: import('$lib/db/session').SessionWithUser;
  }

  interface Stuff {
    feeds?: Feed[];
    feedGroups?: FeedGroup[];
  }

  // interface Platform {}
}
