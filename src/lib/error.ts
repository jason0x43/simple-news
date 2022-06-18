export class ResponseError extends Error {
  body: string;

  constructor(
    method: string,
    path: string,
    status: number,
    statusText: string,
    body: string
  ) {
    super(`${method} to ${path} failed: [${status}] ${statusText}`);
    this.body = body;
  }

  toString() {
    let msg = this.message;
    try {
      const data = JSON.parse(this.body);
      if (data.errors) {
        msg += `\n${JSON.stringify(data.errors, null, '  ')}`;
      }
    } catch {
      // ignore
    }
    return msg;
  }
}
