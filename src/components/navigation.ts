export type Tab = 'puzzles' | 'pieces' | 'rounds' | 'rules';
export interface Route { tab: Tab; code: string }
const tabs: Tab[] = ['puzzles', 'pieces', 'rounds', 'rules'];

/** Preserve unknown codes so the UI can explain a broken link instead of substituting a puzzle. */
export function readRoute(search: string, defaultCode: string): Route {
  const params = new URLSearchParams(search);
  const candidate = params.get('tab') as Tab;
  return {
    tab: tabs.includes(candidate) ? candidate : 'puzzles',
    code: params.has('p') ? (params.get('p') ?? '').trim().toUpperCase() : defaultCode,
  };
}
export function routeUrl(href: string, route: Route): URL {
  const url = new URL(href);
  url.searchParams.set('p', route.code);
  if (route.tab === 'puzzles') url.searchParams.delete('tab');
  else url.searchParams.set('tab', route.tab);
  return url;
}
