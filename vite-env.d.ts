/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOGIN_USERNAME: string;
  readonly VITE_LOGIN_PASSWORD: string;
  readonly GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}