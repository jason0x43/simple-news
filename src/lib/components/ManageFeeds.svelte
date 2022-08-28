<script type="ts">
  import { post, put } from '$lib/request';
  import Dialog from './Dialog.svelte';
  import Portal from './Portal.svelte';
  import Select from './Select.svelte';
  import type {
    AddGroupFeedRequest,
    AddGroupFeedResponse
  } from 'src/routes/api/feedgroups';
  import { invalidate } from '$app/navigation';
  import { showToast } from '$lib/toast';
  import { getEventValue } from '$lib/util';
  import { getAppContext } from '$lib/contexts';
  import type { Feed, FeedGroup } from '$lib/db/schema';

  const { feeds, feedGroups, managingFeeds } = getAppContext().stores;
  const groups: { [feedId: string]: string } = {};

  if ($feedGroups) {
    for (const group of $feedGroups) {
      for (const feedGroup of group.feeds) {
        groups[feedGroup.id] = group.id;
      }
    }
  }

  let busy = false;
  let feedUrl: string = '';

  async function addFeed() {
    busy = true;
    let err: unknown | undefined;

    try {
      await post('/api/feeds', { url: feedUrl });
      feedUrl = '';
      invalidate('/api/feeds');
    } catch (error) {
      err = error;
      console.warn(error);
    }

    setTimeout(() => {
      busy = false;
      if (err) {
        showToast('Unable to add feed', { type: 'bad', duration: 2000 });
      } else {
        showToast('Feed added', { type: 'good', duration: 2000 });
      }
    }, 500);
  }

  async function updateGroup({
    feedId,
    groupId
  }: {
    feedId: Feed['id'];
    groupId: FeedGroup['id'];
  }): Promise<void> {
    busy = true;
    let err: unknown | undefined;

    try {
      await put<AddGroupFeedRequest, AddGroupFeedResponse>('/api/feedgroups', {
        feedId,
        groupId
      });
      invalidate('/api/feedstats');
      invalidate('/api/feedgroups');
    } catch (error) {
      err = error;
      console.warn(error);
    }

    setTimeout(() => {
      busy = false;
      if (err) {
        showToast('Unable to update feed', { type: 'bad', duration: 2000 });
      } else {
        showToast('Feed updated', { type: 'good', duration: 2000 });
      }
    }, 500);
  }

  $: sortedFeeds = $feeds.sort((a, b) => {
    if (a.title === b.title) {
      return 0;
    }
    if (a.title > b.title) {
      return 1;
    }
    return -1;
  });
</script>

<Portal anchor="modal">
  <Dialog
    title="Manage Feeds"
    onClose={() => {
      $managingFeeds = false;
    }}
    {busy}
  >
    <div class="manage-feeds">
      <div class="scroller">
        <section>
          <h3>Feeds</h3>
          <div class="list-wrapper">
            <div class="table">
              {#each sortedFeeds as feed (feed.id)}
                <div class="row">
                  <div class="feed">
                    {feed.title}
                    <div class="feed-url">{feed.url}</div>
                  </div>
                  <div>
                    <Select
                      value={groups[feed.id] ?? 'not subscribed'}
                      on:change={(event) => {
                        const value = getEventValue(event);
                        if (value) {
                          updateGroup({ feedId: feed.id, groupId: value });
                        }
                      }}
                    >
                      <option value="not subscribed">Not subscribed</option>
                      {#each $feedGroups as group (group.id)}
                        <option value={group.id}>{group.name}</option>
                      {/each}
                    </Select>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </section>

        <section>
          <h3>Add Feed</h3>
          <form on:submit|preventDefault={addFeed}>
            <input bind:value={feedUrl} placeholder="https://..." />
            <button>Save</button>
          </form>

          <h3>Add Group</h3>
          <form>
            <input name="group-name" placeholder="Applications" />
            <button>Save</button>
          </form>

          <h3>Rename Group</h3>
          <form>
            <Select value={$feedGroups[0]?.id}>
              {#each $feedGroups as group (group.id)}
                <option value={group.id}>{group.name}</option>
              {/each}
            </Select>
            <input name="group-name" placeholder="Applications" />
            <button>Save</button>
          </form>
        </section>
      </div>
    </div>
  </Dialog>
</Portal>

<style>
  .manage-feeds {
    display: flex;
  }

  .scroller {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 1em;
    flex-grow: 1;
  }

  section {
    box-sizing: border-box;
    padding: 1em;
    display: flex;
    flex-direction: column;
    gap: 1em;
    overflow: auto;
  }

  section:first-child {
    border-right: solid 1px var(--border);
    padding-right: 2em;
  }

  section:last-child {
    padding-left: 2em;
  }

  h3 {
    margin: 0;
  }

  .list-wrapper {
    overflow: auto;
    display: flex;
  }

  form {
    display: flex;
    gap: var(--gap);
  }

  input {
    flex-grow: 1;
    min-width: 1em;
  }

  .feed-url {
    font-style: italic;
    font-size: 90%;
    margin-top: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .table {
    display: grid;
    grid-template-columns: 1fr min-content;
    grid-auto-rows: min-content;
    width: 100%;
  }

  .row {
    display: contents;
  }

  .row > * {
    border-bottom: solid 1px var(--border);
    white-space: nowrap;
    text-overflow: ellipsis;
    padding: 0.5em 0;
  }

  .row:last-child > * {
    border-bottom: none;
    padding-bottom: none;
  }

  .feed {
    overflow: hidden;
    padding-right: 1em;
  }

  /* Mobile */
  @media only screen and (max-width: 800px) {
    .manage-feeds {
      display: flex;
      flex-direction: column;
      overflow: auto;
    }

    section:first-child {
      border-right: none;
      padding-right: 1em;
    }

    section:last-child {
      padding-left: 1em;
    }

    .scroller {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      flex-shrink: 0;
      padding: 1em;
    }
  }
</style>
