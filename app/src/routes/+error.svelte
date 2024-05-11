<script>
	import "../app.css";
	import { page } from "$app/stores";
</script>

<div class="absolute-center">
	<h2>{$page.status}: {$page.error?.message}</h2>
</div>
