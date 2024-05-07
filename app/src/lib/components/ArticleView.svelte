<script lang="ts">
	import type { Article, Feed } from "$server";
	import { isActionEvent, verifyHashLinkTarget } from "../util";

	export let article: Article;
	export let feedId: string;
	export let feeds: Feed[];

	let className = "";
	export { className as class };

	$: articleFeed = feeds.find((f) => f.id === article.feed_id);

	let scrollBox: HTMLElement | undefined;
	let prevArticle = article.id;
	let contentDiv: HTMLDivElement | undefined;

	$: visible = Boolean(article);

	$: {
		if (prevArticle !== article.id) {
			scrollBox?.scrollTo({ top: 0 });
			prevArticle = article.id;
		}
	}

	function onLinkClick(event: Event) {
		if (isActionEvent(event)) {
			event.preventDefault();
			const elem = event.target as HTMLElement;
			const href = elem.getAttribute("href") ?? undefined;
			if (href) {
				if (href.startsWith("#")) {
					verifyHashLinkTarget(href, contentDiv);
					window.open(href, "_self");
				} else {
					window.open(href, "_blank");
				}
			}
		}
	}
</script>

<div
	class={`
			flex-auto
			overflow-y-auto
			bg-white
			px-4
			text-black
			dark:bg-black
			dark:text-white
			${className}
		`}
	bind:this={scrollBox}
>
	{#if visible && article && articleFeed}
		<div class="z-10 mx-auto flex max-w-screen-md flex-col gap-4 py-5">
			<div class="flex flex-col gap-4">
				<a href={article.link ?? undefined} target="_blank">
					<h1>{article.title}</h1>
				</a>
				<h2>{articleFeed.title}</h2>
			</div>
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div
				class="content pb-4"
				bind:this={contentDiv}
				on:click={onLinkClick}
				on:keypress={onLinkClick}
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html article.content}
			</div>
		</div>
		<a
			class={`
					fixed
					bottom-0
					right-0
					z-10
					block
					h-20
					w-20
					bg-transparent
					text-transparent
				`}
			href={`/reader/${feedId}`}>&nbsp;</a
		>
	{/if}
</div>

<!-- svelte-ignore css-unused-selector -->
<style lang="postcss">
	@import url("highlight.js/styles/default.css") screen and
		(prefers-color-scheme: light);
	@import url("highlight.js/styles/dark.css") screen and
		(prefers-color-scheme: dark);

	.content {
		font-size: 120%;
		line-height: 1.4rem;
	}

	.content :global(a) {
		color: theme(colors.blue.DEFAULT);
		text-decoration: underline;
	}

	.content :global(:not(.linkback) + .linkback) {
		margin-top: 1rem;
	}

	.content :global(.linkback) {
		font-style: italic;
	}

	.content :global(.linkback a) {
		font-style: normal;
	}

	.content :global(h1) {
		margin-top: 0;
		line-height: 1.3em;
	}

	.content :global(figure) {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 1rem 0;
	}

	.content :global(figcaption) {
		font-style: italic;
		opacity: 0.7;
	}

	.content :global(cite) {
		font-size: calc(var(--font-size) * 0.9);
	}

	.content :global(p) {
		margin: 1rem 0;
	}

	.content :global(pre) {
		overflow-x: auto;
	}

	.content :global(li) {
		margin: 0.5em 0;
	}

	.content :global(aside) {
		margin: 1.5em 0;
		font-size: calc(var(--font-size) * 1.25);
	}

	.content :global(q) {
		font-style: italic;
		color: #999;
		margin: 0 64px;
		display: block;
	}

	.content :global(blockquote) {
		font-style: italic;
		border-left: solid 0.5rem #ddf;
		padding-left: 0.5rem;
		margin-top: 1rem;
	}

	.content :global(*) {
		max-width: 100% !important;
	}

	.content :global(img) {
		border-radius: 6px;
		height: auto;
		margin: 0 auto;
	}

	.content :global(p) :global(img) {
		vertical-align: middle;
	}

	.content :global(table) {
		width: 100%;
	}

	.content :global(.image img),
	.content :global(figure img) {
		margin: 0;
	}

	.content :global(.feedflare) {
		display: none;
	}

	.content :global(.center) {
		text-align: center;
	}

	.content :global(hr) {
		height: 1px;
		border: none;
		background: #ddd;
	}

	.content :global(pre) {
		padding: 1rem;
		font-size: 90%;
		background: var(--matte);
		border: solid 1px var(--highlight-text);
		border-radius: 6px;
	}

	.content :global(p) :global(code) {
		font-size: 90%;
		padding: 0.05rem 0.1rem 0.15rem 0.1rem;
		background: var(--matte);
		border: solid 1px var(--highlight-text);
		border-radius: 3px;
	}

	.content :global(.center-wrap) {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.content :global(.share_submission) {
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
	}
	/* from tor.com feeds */
	.content :global(.ebook-links) {
		display: flex;
		flex-direction: row;
		list-style-type: none;
		padding: 0;
		gap: 1rem;
	}
	.content :global(.ebook-links img),
	.content :global(.ebook-links li) {
		margin: 0;
	}
	.content :global(.squib .alignleft) {
		margin: 0;
		margin-right: 1em;
		float: left;
	}
</style>
