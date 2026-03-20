import { test, expect } from '@playwright/test';
import { load, waitForLazyImages, expectToHaveScreenshot} from './utils';

const pages = [
    {name: 'home', url: '', ratio: 0.01},
];

pages.forEach(({ name, url, ratio }) => {
    // You can also do it with test.describe() or with multiple tests as long the test name is unique.
    test(`${name}`, async ({ page }) => {
        await load(page, url);
        await waitForLazyImages(page);
        
        await expectToHaveScreenshot(page, ratio);
    });
});