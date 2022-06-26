<script type="ts">
  import { goto } from '$app/navigation';
  import { session } from '$app/stores';
  import { isErrorResponse, post } from '$lib/request';
  import type { LoginRequest, LoginResponse } from './auth/login';

  let errors: Record<string, string> | null = null;
  let username = '';
  let password = '';

  async function submit() {
    const response = await post<LoginRequest, LoginResponse>('/auth/login', {
      username,
      password
    });

    if (isErrorResponse(response)) {
      errors = response.errors;
    } else {
      $session.user = response.user;
      goto('/');
    }
  }
</script>

<section class="login">
  <form on:submit|preventDefault={submit}>
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
