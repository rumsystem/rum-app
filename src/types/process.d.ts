declare namespace NodeJS {
  interface ProcessEnv {
    IS_ELECTRON: string | undefined
    TEST_ENV: string | undefined
    NODE_ENV: 'development' | 'production'
  }
}
