<script lang="ts">
	import type { Article, Feed } from "simple-news-types";
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
		dark:bg-black
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
			href={`/feed/${feedId}`}>&nbsp;</a
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
		@apply text-base;
	}

	.content :global(a) {
		@apply text-blue underline;
	}

	.content :global(:not(.linkback) + .linkback) {
		@apply mt-4;
	}

	.content :global(.linkback) {
		@apply italic;
	}

	.content :global(.linkback a) {
		@apply not-italic;
	}

	.content :global(figure) {
		@apply my-4 flex flex-col items-center;
	}

	.content :global(figcaption) {
		@apply italic opacity-70;
	}

	.content :global(cite) {
		@apply text-sm;
	}

	.content :global(h1),
	.content :global(h2),
	.content :global(h3),
	.content :global(h4),
	.content :global(p) {
		@apply my-4;
	}

	.content :global(pre) {
		@apply overflow-x-auto;
	}

	.content :global(ul) {
		@apply flex flex-col list-disc pl-8 gap-2;
	}

	.content :global(li) {
		@apply m-0;
	}

	.content :global(aside) {
		@apply my-6 text-lg;
	}

	.content :global(q) {
		@apply mx-[64px] block italic text-neutral-400;
	}

	.content :global(blockquote) {
		@apply my-4 border-l-4 border-border-light pl-2 italic dark:border-border-dark;
	}

	.content :global(*) {
		@apply !max-w-full;
	}

	.content :global(img) {
		@apply mx-auto my-0 h-auto rounded-md;
	}

	.content :global(p) :global(img) {
		@apply align-middle;
	}

	.content :global(table) {
		@apply w-full;
	}

	.content :global(.image img),
	.content :global(figure img) {
		@apply m-0;
	}

	.content :global(.feedflare) {
		@apply hidden;
	}

	.content :global(.center) {
		@apply text-center;
	}

	.content :global(hr) {
		@apply h-[1px] border-0 bg-neutral-800;
	}

	.content :global(pre) {
		@apply rounded-md
			border
			border-border-light
			bg-hover-light
			p-4
			text-sm
			dark:border-border-dark
			dark:bg-hover-dark;
	}

	.content :global(p) :global(code) {
		@apply rounded-md
			border
			border-border-light
			bg-hover-light
			px-[0.1rem]
			pb-[0.15rem]
			pt-[0.05rem]
			text-sm
			dark:border-border-dark
			dark:bg-hover-dark;
	}

	.content :global(.center-wrap) {
		@apply flex flex-col items-center;
	}

	.content :global(.share_submission) {
		@apply flex flex-row gap-2;
	}
	/* from tor.com feeds */
	.content :global(.ebook-links) {
		@apply flex list-none flex-row gap-4 p-0;
	}
	.content :global(.ebook-links img),
	.content :global(.ebook-links li) {
		@apply m-0;
	}
	.content :global(.squib .alignleft) {
		@apply float-left m-0 mr-4;
	}
</style>
