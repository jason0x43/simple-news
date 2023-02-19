import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, params }) => {
	// The purpose of this load function is to return the articleId param
	// separately from the +layout.server.ts `load` function. If the articleId
	// is returned there, it will cause the server `load` function to run every
	// time the articleId param changes.

	return {
		...data,
		articleId: params.articleId
	};
};
