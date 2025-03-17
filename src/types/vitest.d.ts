declare module 'vitest' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function expect<T>(actual: T): {
    toBe(expected: any): void;
    toEqual(expected: any): void;
    toBeInstanceOf(expected: any): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledWith(...args: any[]): void;
    not: {
      toHaveBeenCalled(): void;
      toHaveBeenCalledWith(...args: any[]): void;
    };
  };
  export function beforeEach(fn: () => void | Promise<void>): void;
  export const vi: {
    fn(): jest.Mock;
    fn<T extends (...args: any[]) => any>(implementation?: T): jest.Mock<ReturnType<T>, Parameters<T>>;
    clearAllMocks(): void;
    spyOn(object: any, method: string): jest.SpyInstance;
    mock(path: string, factory?: () => any): void;
    stubGlobal(name: string, value: any): void;
  };
  
  namespace jest {
    interface Mock<T = any, Y extends any[] = any[]> {
      (...args: Y): T;
      mockImplementation(fn: (...args: Y) => T): this;
      mockReturnThis(): this;
      mockReturnValue(value: T): this;
    }
    
    interface SpyInstance<T = any, Y extends any[] = any[]> {
      (...args: Y): T;
      mockImplementation(fn: (...args: Y) => T): this;
    }
  }
}
