declare module 'dotenv' {
  export interface DotenvConfigOutput {
    parsed?: { [key: string]: string };
    error?: Error;
  }

  export interface DotenvConfigInput {
    path?: string;
    encoding?: string;
    debug?: boolean;
    override?: boolean;
  }

  export function config(options?: DotenvConfigInput): DotenvConfigOutput;
  export function parse(src: string | Buffer): { [key: string]: string };
} 