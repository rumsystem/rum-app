declare namespace NodeJS {
  interface ProcessEnv {
    IS_ELECTRON: string | undefined
    NODE_ENV: 'development' | 'production'
  }
}
