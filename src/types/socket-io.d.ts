// Type declarations for socket.io modules used by examples/websocket/*
// These packages may not be installed in the main project; the examples
// folder is illustrative only. Declaring the modules here prevents
// TypeScript from emitting TS2307 ("Cannot find module") errors during
// type-checking while keeping `examples/websocket/*` runnable when the
// packages ARE installed (e.g. inside the mini-service).

declare module 'socket.io-client' {
  // Allow both default and namespace import styles (frontend uses `import { io }`).
  export const io: any;
  const _default: any;
  export default _default;
}

declare module 'socket.io' {
  export class Server {
    constructor(server?: any, opts?: any);
    on(event: string, cb: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): this;
    close(): void;
    [key: string]: any;
  }
}
