// @ts-ignore
import common from '/app/playwright.config.common';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    ...common,
    
    projects: [
        ...common['projects'],
        
        // Define additional projects here, or overwrite them completely
    ],

    expect: {
        timeout: 30000,
    }
});
