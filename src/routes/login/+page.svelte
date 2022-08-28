<script type="ts">
  export let errors: Record<string, string> | undefined;

  let username = '';
  let password = '';
</script>

<section class="login">
  <form method="post">
    <input name="username" placeholder="Username" bind:value={username} />
    <input
      name="password"
      placeholder="Password"
      type="password"
      bind:value={password}
    />
    <button type="submit">Login</button>

    {#if errors?.username}
      <div id="username-error">{errors.username}</div>
    {/if}

    {#if errors?.password}
      <div id="password-error">{errors.password}</div>
    {/if}
  </form>
</section>

<style>
  .login {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  form {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--gap);
  }
</style>
