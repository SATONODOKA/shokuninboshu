/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LINE_LIFF_ID: string
  readonly VITE_LINE_CHANNEL_ID: string
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}