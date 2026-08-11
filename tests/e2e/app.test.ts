import { test, expect } from '@playwright/test';

const POPUP_URL = 'http://localhost:3000/src/popup.html';
const SIDE_PANEL_URL = 'http://localhost:3000/src/sidepanel.html';

test.describe('Popup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(POPUP_URL);
    await page.waitForLoadState('networkidle');
  });

  test('page title is correct', async ({ page }) => {
    await expect(page).toHaveTitle(/Legado Source Generator/);
  });

  test('renders rule type tabs', async ({ page }) => {
    const tabs = page.locator('.popup__tab');
    await expect(tabs).toHaveCount(5);
    await expect(tabs.nth(0)).toContainText('搜索规则');
    await expect(tabs.nth(1)).toContainText('书籍信息');
    await expect(tabs.nth(2)).toContainText('目录规则');
    await expect(tabs.nth(3)).toContainText('内容规则');
    await expect(tabs.nth(4)).toContainText('探索 URL');
  });

  test('active tab is highlighted', async ({ page }) => {
    const activeTab = page.locator('.popup__tab--active');
    await expect(activeTab).toHaveCount(1);
  });

  test('switching tabs updates active state', async ({ page }) => {
    const tabs = page.locator('.popup__tab');
    await tabs.nth(2).click();
    const activeTab = page.locator('.popup__tab--active');
    await expect(activeTab).toHaveCount(1);
    await expect(activeTab).toContainText('目录规则');
  });

  test('renders field editor with label', async ({ page }) => {
    const tabs = page.locator('.popup__tab');
    await tabs.nth(0).click();
    await page.waitForTimeout(500);
    const label = page.locator('.field-editor__label');
    await expect(label).toBeVisible();
  });
});

test.describe('Side Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SIDE_PANEL_URL);
    await page.waitForLoadState('networkidle');
  });

  test('page title is correct', async ({ page }) => {
    await expect(page).toHaveTitle(/Legado Source Generator/);
  });

  test('renders side panel header', async ({ page }) => {
    const title = page.locator('.sidepanel__title');
    await expect(title).toBeVisible();
  });

  test('renders mode buttons', async ({ page }) => {
    const buttons = page.locator('.sidepanel__mode-btn');
    await expect(buttons).toHaveCount(3);
    await expect(buttons.nth(0)).toContainText('AI 生成');
    await expect(buttons.nth(1)).toContainText('AI 设置');
    await expect(buttons.nth(2)).toContainText('规则');
  });

  test('active mode button is highlighted', async ({ page }) => {
    const activeBtn = page.locator('.sidepanel__mode-btn--active');
    await expect(activeBtn).toHaveCount(1);
  });

  test('switching to rules mode shows popup tabs', async ({ page }) => {
    const rulesBtn = page.locator('.sidepanel__mode-btn').filter({ hasText: '规则' });
    await rulesBtn.click();
    await page.waitForTimeout(500);
    const tabs = page.locator('.popup__tab');
    await expect(tabs).toHaveCount(5);
  });

  test('switching to ai-generate mode shows ai panel', async ({ page }) => {
    const aiBtn = page.locator('.sidepanel__mode-btn').filter({ hasText: 'AI 生成' });
    await aiBtn.click();
    await page.waitForTimeout(500);
    const urlInput = page.locator('input[placeholder*="URL"], input[type="url"], input').first();
    await expect(urlInput).toBeVisible();
  });
});
