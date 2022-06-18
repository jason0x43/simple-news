/// <reference types="@sveltejs/kit" />

declare namespace App {
  interface Session {
    id: import('$lib/db/session').Session['id'];
    user: import('$lib/db/user').UserWithFeeds;
  }

  interface Locals {
    session?: import('$lib/db/session').SessionWithUser;
  }

  // interface Platform {}
  // interface Stuff {}
}
