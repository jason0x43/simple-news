/// <reference types="@sveltejs/kit" />

declare namespace App {
  interface Session {
    id: import('$lib/db/session').Session['id'];
    user: import('$lib/db/user').User;
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
