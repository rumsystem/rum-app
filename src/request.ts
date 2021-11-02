import { sleep } from 'utils';
export default async (url: any, options: any = {}) => {
  const hasEffectMethod = options.method === 'POST' || options.method === 'DELETE' || options.method === 'PUT';
  if (hasEffectMethod) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(options.body);
  }
  if (!options.base) {
    options.credentials = 'include';
  }
  const result = await Promise.all([
    fetch(new Request((options.base || '') + url), options),
    sleep(options.minPendingDuration ? options.minPendingDuration : 0)
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
  } else {
    if (hasEffectMethod && res.status === 401) {
      (window as any).store.modalStore.openLogin()
    }
    throw Object.assign(new Error(), {
      code: resData.code,
      status: res.status,
      message: resData.message,
    });
  }
};
