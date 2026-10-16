export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const targetUrl = new URL(url.pathname + url.search, 'https://imposter-api.hun-wrk0966.workers.dev');
  return fetch(new Request(targetUrl.toString(), context.request));
};
