export type DbBinding = {
  prepare: (sql: string) => {
    bind: (...params: any[]) => {
      first: <T = any>() => Promise<T | null>;
      all: <T = any>() => Promise<{ results: T[] }>;
      run: () => Promise<any>;
    };
    first: <T = any>() => Promise<T | null>;
    all: <T = any>() => Promise<{ results: T[] }>;
    run: () => Promise<any>;
  };
};
