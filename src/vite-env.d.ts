/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LINE_LIFF_ID?: string
  readonly VITE_LINE_CHANNEL_ID?: string
  readonly VITE_API_BASE_URL?: string
  readonly NODE_ENV?: string
  readonly BASE_URL?: string
  readonly PROD?: boolean
  readonly DEV?: boolean
  readonly SSR?: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}