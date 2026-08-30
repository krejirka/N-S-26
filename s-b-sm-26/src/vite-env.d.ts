/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NATIVE?: string;
  readonly VITE_API_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
