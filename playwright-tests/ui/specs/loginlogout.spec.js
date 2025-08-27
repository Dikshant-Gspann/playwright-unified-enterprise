import { test, expect } from '@playwright/test';
import { SauceDemoPage } from '../pages/SauceDemoPage';

test.describe('SauceDemo Login & Logout Flow', () => {
  let demo;

  test.beforeEach(async ({ page }) => {
    demo = new SauceDemoPage(page);
    await demo.goto();
  });

  test('user can login and logout successfully', async () => {
    // 1) Log in
    await demo.login('standard_user', 'secret_sauce');

    // 2) Verify we landed on the products page (logo visible)
    await expect(demo.productsTitle).toHaveText('Swag Labs');

    // 3) Open the side menu
    await demo.openMenu();

    // 4) Click Logout
    await demo.logout();

    // 5) After logout, we should be back at the login page
    await expect(demo.page).toHaveURL('https://www.saucedemo.com/');
  });
});
