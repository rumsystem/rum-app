declare namespace NodeJS {
  interface ProcessEnv {
    TEST_ENV: string | undefined
    NODE_ENV: 'development' | 'production'
  }
}
