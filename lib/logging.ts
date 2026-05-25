type RequestLog = {
  method: string;
  path: string;
  status: number;
  latency_ms: number;
  key_id?: string;
  error_code?: string;
};

export function logRequest(log: RequestLog): void {
  console.log(
    JSON.stringify({
      level: log.status >= 500 ? "error" : "info",
      event: "http_request",
      method: log.method,
      path: log.path,
      status: log.status,
      latency_ms: log.latency_ms,
      key_id: log.key_id ?? null,
      error_code: log.error_code ?? null,
      timestamp: new Date().toISOString()
    })
  );
}
