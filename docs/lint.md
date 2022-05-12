## Lint
This project use eslint for code linting, as tslint has been [deprecated](https://github.com/palantir/tslint) and migrated to [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint), now there are good ts linting support for eslint.

Errors reported by linters won't block webpack compilation (for convenience purpose), so be aware of webpack output for compilation status.

It's confirgured with syntax and style rules, so it's both linter and formatter.

## To Run Lint
- While running `yarn start` or `yarn start:renderer`, after webpack has been started, linter services will print the results to console
- Run `eslint ./src/ [--fix]` to lint all files.
- Configure eslint for vscode

## Configure eslint for vscode
1. install [dbaeumer.vscode-eslint](https://marketplace.visualstudio.com/items?itemName=daeumer.vscode-eslint)

2. Open settings.json (press F1 and select "Open Settings (JSON)")

![image](https://user-images.githubusercontent.com/2271900/129650636-ed4c158d-1343-4f3d-9a5e-7a14801c7d9c.png)

3. Add the following settings, it would enable eslint for `js,jsx,ts,tsx`, and apply autofix on save.

```json
{
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "[javascript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  },
  "[typescript]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    }
  }
}
```
![image](https://user-images.githubusercontent.com/2271900/129658873-893df9cb-a277-4757-9ab7-d8b5631cad60.png)

4. Or manually run command `eslint.executeAutofix` (Eslint: Fix all auto-fixable Problems).

5. Added jsx?/tsx? in .prettierignore, As it would conflict with eslint

When configured as above, after coding and press ctrl/cmd + s to save to auto-fix all autofix-able problems (most are styling issues). Problems that can't be auto-fixed would need a manual fix.
