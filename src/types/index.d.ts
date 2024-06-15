/// <reference types="node" />

declare module '@tsbb/copy-template-dir' {
  export default function(templateDir: string, targetDir: string, options: Record<string, any>, callback: (err: Error, createdFiles: string[]) => void): void;
}
