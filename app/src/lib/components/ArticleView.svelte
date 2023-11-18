<script lang="ts">
	import CloseIcon from "../icons/Close.svelte";
	import { isActionEvent } from "../util";
	import { article, articleFeed, displayType, feedId } from "../state";
	import { slide } from "../transition";

	let scrollBox: HTMLElement | undefined;
	let prevArticle = $article?.id;

	$: visible = Boolean($article);

	$: {
		if ($article && prevArticle !== $article?.id) {
			scrollBox?.scrollTo({ top: 0 });
			prevArticle = $article.id;
		}
	}

	function onLinkClick(event: Event) {
		if (isActionEvent(event)) {
			event.preventDefault();
			const elem = event.target as HTMLElement;
			const href = elem.getAttribute("href") ?? undefined;
			if (href) {
				if (href.startsWith("#")) {
					window.open(href, "_self");
				} else {
					window.open(href, "_blank");
				}
			}
		}
	}

	const animate =
		$displayType === "mobile"
			? (node: HTMLElement, options: Parameters<typeof slide>[1]) =>
					slide(node, options)
			: () => ({});
</script>

{#if visible && $article && $articleFeed}
	<div
		class="article"
		class:mobile={$displayType === "mobile"}
		bind:this={scrollBox}
		in:animate={{ direction: "left", duration: 250 }}
		out:animate={{ direction: "left", duration: 250 }}
	>
		<div class="scroller">
			<div class="header">
				<a href={$article.link ?? undefined} target="_blank">
					<h2>{$article.title}</h2>
				</a>
				<h3>{$articleFeed.title}</h3>
			</div>
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div class="content" on:click={onLinkClick} on:keypress={onLinkClick}>
				{@html $article.content}
			</div>
		</div>
		<a class="close" href={`/reader/${$feedId}`}>
			<CloseIcon size={22} />
		</a>
	</div>
{/if}

<!-- svelte-ignore css-unused-selector -->
<style>
	@import url("highlight.js/styles/default.css") screen and
		(prefers-color-scheme: light);
	@import url("highlight.js/styles/dark.css") screen and
		(prefers-color-scheme: dark);

	.article {
		width: 100%;
		background-color: var(--background);
		overflow-y: auto;
	}

	.mobile {
		position: absolute;
		height: 100%;
	}

	.header {
		font-weight: bold;
		font-size: var(--font-size);
		display: flex;
		flex-direction: column;
		align-items: stretch;
		padding: 0 5%;
	}

	.header,
	.content {
		max-width: 50rem;
		margin-left: auto;
		margin-right: auto;
	}

	.header a {
		color: var(--foreground);
		text-decoration: none;
		display: block;
		margin-top: 2rem;
		flex-grow: 1;
	}

	.header h3 {
		margin: 0.5rem 0 1rem 0;
	}

	.header h2 {
		margin: 0;
	}

	.close {
		display: none;
	}

	.content {
		padding-left: 5%;
		padding-right: 5%;
		font-size: calc(var(--font-size) * 1.15);
		padding-bottom: 3rem;
		line-height: 1.6em;
	}

	.content :global(h1) {
		margin-top: 0;
		line-height: 1.3em;
	}

	.content :global(figure) {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-left: 0;
		margin-right: 0;
	}

	.content :global(figcaption) {
		font-style: italic;
		opacity: 0.7;
	}

	.content :global(cite) {
		font-size: calc(var(--font-size) * 0.9);
	}

	.content :global(p) {
		margin: 0.75em 0;
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
	}

	.content :global(*) {
		max-width: 100% !important;
	}

	.content :global(img) {
		border-radius: 6px;
		height: auto;
	}

	.content :global(p) :global(img) {
		vertical-align: middle;
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

	@media only screen and (max-width: 1000px) {
		.content :global(blockquote) {
			margin-left: 20px;
			margin-right: 20px;
		}
	}

	@media only screen and (max-width: 800px) {
		/* ensure article text renders behind close button */
		.scroller {
			z-index: 5;
		}

		.close {
			cursor: pointer;
			background: var(--matte);
			border: solid 1px var(--border);
			border-radius: var(--border-radius);
			display: flex;
			align-items: center;
			justify-content: center;
			position: fixed;
			width: 2rem;
			height: 2rem;
			bottom: 0.5rem;
			right: 0.5rem;
			z-index: 10;
		}
	}
</style>
