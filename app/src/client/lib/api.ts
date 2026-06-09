export interface ApiResult<T = any> {
  status: number;
  data: T;
}

async function request<T>(path: string, opts?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...opts,
  });
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  // 422 = wrong code; callers handle it via data.ok, so don't throw.
  if (!res.ok && res.status !== 422) {
    throw Object.assign(new Error(data?.error ?? "request failed"), { status: res.status });
  }
  return { status: res.status, data };
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),
  post: <T = any>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
};
