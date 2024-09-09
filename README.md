# ccc-e2e

## usage

 ### 1. Install default browsers

```bash
npx playwright install
```



### 2. Run tests

#### Headless (default: enabled)

```bash
npx playwright test
```

#### Headless (false)

Comment out `--headless=new`, uncomment `// headless: false,`

```js
    const context = await chromium.launchPersistentContext('', {
      headless:false,
      args: [
        // `--headless=new`,
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
```

```bash
npx playwright test
```

