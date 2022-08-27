## Test

To run test with a test build
```sh
yarn build:test
yarn test
```

To run test with a dev server
```sh
yarn start:renderer
# start in another shell
yarn test:dev
```

To run specific tests
```sh
# testname1 is a partial string of test file name
yarn test testname1 [testname2] ...
yarn test:dev testname1 [testname2] ...
```

`setup.ts` includes a method for launching the electron app, userData will be saved to `tests/tests/userData`, and it will be cleared before each lauch to ensure a consistant enviroment.

While running the tests, a env var will be set on main process and a global variable will be set on renderer procrss to distinguish the normal and test env. After open the app, it will create a internal mode node automatically with it's data saved in `tests/tests/userData/rum-user-data`.

## Writing tests
Create a new file in `tests/tests/`, and `export default` the function you want to run during the test. The name of the test will be the filename.
