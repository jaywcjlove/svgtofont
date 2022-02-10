/// <reference types="node" />

declare module 'copy-template-dir' {
  export default function(templateDir: string, targetDir: string, options: Record<string, any>, callback: (err: Error, createdFiles: string[]) => void): void;
}
