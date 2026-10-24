import {defineConfig,devices} from '@playwright/test';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
export default defineConfig({
  testDir:'.',testMatch:'**/*.spec.mjs',timeout:60000,workers:2,retries:1,
  outputDir:fileURLToPath(new URL('../../test-results/',import.meta.url)),
  use:{baseURL:'http://127.0.0.1:9012',trace:'retain-on-failure',screenshot:'only-on-failure',reducedMotion:'reduce'},
  projects:[
    {name:'chromium-desktop',use:{...devices['Desktop Chrome']}},
    {name:'webkit-desktop',use:{...devices['Desktop Safari']}},
    {name:'chromium-tablet',use:{browserName:'chromium',viewport:{width:820,height:1180}}},
    {name:'webkit-tablet',use:{browserName:'webkit',viewport:{width:820,height:1180}}},
    {name:'chromium-mobile',use:{...devices['Pixel 5']}},
    {name:'webkit-mobile',use:{...devices['iPhone 13']}}
  ],
  webServer:{command:'node tools/serve.mjs',cwd:root,url:'http://127.0.0.1:9012',env:{PORT:'9012'},reuseExistingServer:false,timeout:30000}
});
