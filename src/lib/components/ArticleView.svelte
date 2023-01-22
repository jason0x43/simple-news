<script lang="ts">
	import { page } from '$app/stores';
	import type { ArticleWithUserData } from '$lib/db/article';
	import {
		isActionEvent,
		loadValue,
		storeValue,
		unescapeHtml
	} from '$lib/util';
	import CloseIcon from '$lib/icons/Close.svelte';
	import { onMount } from 'svelte';

	export let article: ArticleWithUserData | null;

	const target = 'SimpleNews_ArticleView';

	let scrollBox: HTMLElement | undefined;
	let prevArticle = article;

	$: visible = Boolean(article);

	$: {
		if (prevArticle !== article) {
			scrollBox?.scrollTo({ top: 0 });
			prevArticle = article;
		}
	}

	function onLinkClick(event: Event) {
		if (isActionEvent(event)) {
			event.preventDefault();
			const elem = event.target as HTMLElement;
			const href = elem.getAttribute('href') ?? undefined;
			if (href) {
				globalThis.open(href, target);
			}
		}
	}

	type ScrollData = { articleId: string; scrollTop: number };
	let scrollTimer: ReturnType<typeof setTimeout>;

	function handleScroll(event: Event) {
		const target = event.target as HTMLDivElement;
		const { scrollTop } = target;

		clearTimeout(scrollTimer);
		scrollTimer = setTimeout(() => {
			if (article) {
				storeValue<ScrollData>('articleScrollData', {
					articleId: article.id,
					scrollTop
				});
			}
		}, 500);
	}

	export function resetScroll() {
		const header = scrollBox?.querySelector('.scroller > .header');
		header?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	onMount(() => {
		const scrollData = loadValue<ScrollData>('articleScrollData');
		if (scrollData && article && scrollData.articleId === article.id) {
			setTimeout(() => {
				scrollBox?.scrollTo({ top: scrollData.scrollTop });
			});
		}
	});
</script>

{#if visible}
	<div class="article">
		<div class="scroller" bind:this={scrollBox} on:scroll={handleScroll}>
			<div class="header">
				<a href={article?.link ?? undefined} {target}>
					<h2>{article?.title}</h2>
				</a>
			</div>
			<div class="content" on:click={onLinkClick} on:keypress={onLinkClick}>
				{@html unescapeHtml(article?.content ?? '')}
			</div>
		</div>
		<a class="close" href={`/reader/${$page.params.feedId}`}>
			<CloseIcon size={22} />
		</a>
	</div>
{/if}

<style>
	.article {
		width: 100%;
		background-color: var(--background);
	}

	.scroller {
		overflow-y: auto;
		flex-grow: 1;
		height: 100%;
	}

	.header {
		font-weight: bold;
		font-size: var(--font-size);
		display: flex;
		flex-direction: row;
		gap: 1rem;
		align-items: stretch;
		padding: 0 5%;
	}

	.header,
	.content {
		max-width: 800px;
		margin-left: auto;
		margin-right: auto;
	}

	.header a {
		color: var(--foreground);
		text-decoration: none;
		display: block;
		margin: 3rem 0 1rem 0;
		flex-grow: 1;
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
		font-size: calc(var(--font-size) * 1.1);
		font-family: Merriweather, serif;
		font-weight: 300;
		padding-bottom: 3rem;
		line-height: 1.5em;
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

	.content :global(table td) {
		padding: 0 0.5em;
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
	}

	.content :global(*) {
		max-width: 100% !important;
	}

	.content :global(img) {
		height: auto !important;
		border-radius: 6px;
		margin: 2rem 0;
	}

	.content :global(.image),
	.content :global(figure) {
		margin: 2rem 0;
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
			position: absolute;
			width: 2rem;
			height: 2rem;
			bottom: 0.5rem;
			right: 0.5rem;
			z-index: 10;
		}
	}
</style>
