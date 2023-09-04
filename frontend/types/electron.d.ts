declare interface Window {
    electron: {
      send: (channel: string, data: any) => void;
      on: (channel: string, func: (event: any, ...args: any[]) => void) => void;
      once: (channel: string, func: (event: any, ...args: any[]) => void) => void;
      off: (channel: string, func: (event: any, ...args: any[]) => void) => void;
      invoke: (channel: string, ...data: any[]) => Promise<any>;
    };
  }
  