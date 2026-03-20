import {expect, Page} from '@playwright/test';

export async function load(page: Page, url: string) {
    await page.goto(`/${url}`);
}

export async function waitForLazyImages(page: Page) {
    const lazyImages = await page.locator('img[loading="lazy"]:visible').all();
    for (const lazyImage of lazyImages) {
        await lazyImage.scrollIntoViewIfNeeded();
        await expect(lazyImage).not.toHaveJSProperty('naturalWidth', 0);
    }
}

export async function expectToHaveScreenshot(page: Page, ratio: number) {
    await page.evaluate(() => {
        window.scrollTo(0, 0);
    });
    
    await expect(page).toHaveScreenshot({ fullPage: true, maxDiffPixelRatio: ratio });
}