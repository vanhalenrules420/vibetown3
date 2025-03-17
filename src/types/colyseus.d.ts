declare module 'colyseus.js' {
  export class Client {
    constructor(endpoint: string);
    joinOrCreate<T = any>(roomName: string, options?: any): Promise<Room<T>>;
  }

  export class Room<T = any> {
    sessionId: string;
    state: T;
    send(type: string, message?: any): void;
    onMessage(type: string, callback: (message: any) => void): void;
    onLeave(callback: (code: number) => void): void;
  }
}
