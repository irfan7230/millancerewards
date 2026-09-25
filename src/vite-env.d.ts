/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the backend REST API, including the /api/v1 prefix. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
