import sleep from 'utils/sleep';

interface RequestOption extends Omit<RequestInit, 'body'> {
  base: string
  isTextResponse: boolean
  minPendingDuration: number
  body: unknown
  jwt: boolean
}

export default async (url: string, options: Partial<RequestOption> = {}) => {
  const hasEffectMethod = options.method === 'POST'
    || options.method === 'DELETE'
    || options.method === 'PUT';
  if (hasEffectMethod) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(options.body);
  }
  if (!options.base) {
    options.credentials = 'include';
  }

  const store = (window as any).store;

  if (store.nodeStore.mode === 'EXTERNAL' && options.jwt) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${store.nodeStore.apiConfig.jwt}`,
    };
  }
  const result = await Promise.all([
    fetch(new Request((options.base || '') + url), options as RequestInit),
    sleep(options.minPendingDuration ? options.minPendingDuration : 0),
  ]);
  const res: any = result[0];
  let resData;
  if (options.isTextResponse) {
    resData = await res.text();
  } else {
    resData = await res.json();
  }

  if (res.ok) {
    return resData;
  }
  throw Object.assign(new Error(), {
    code: resData.code,
    status: res.status,
    message: resData.message || resData.error,
  });
};
