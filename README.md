# ccc-e2e

## usage

 ### 1. Install Chromium Browser

```bash
npx playwright install chromium
```



### 2. Run tests

#### Headless (default: enabled)

##### macOS

```bash
npx playwright test
```

##### ubuntu

It is necessary to use Xvfb to simulate a graphical environment.

```bash
sudo apt-get install -y xvfb

# Start Xvfb
Xvfb :99 -screen 0 1280x720x24 &
export DISPLAY=:99

# Run tests
npx playwright test

# Close Xvfb after the tests are completed
pkill Xvfb
```



#### Headless (disabled)

Uncomment`--headless=new`,  comment out `// headless: false,`

```js
    const context = await chromium.launchPersistentContext('', {
      args: [
        `--headless=new`,
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });
```

```bash
npx playwright test
```

