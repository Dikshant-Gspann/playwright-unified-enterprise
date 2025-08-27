import { Page, Locator, expect } from '@playwright/test';

export class SauceDemoPage {
  page;
  username;
  password;
  loginButton;
  productsTitle;
  burgerMenuButton;
  logoutLink;

  constructor(page) {
    this.page = page;
    this.username        = page.locator('#user-name');
    this.password        = page.locator('[data-test="password"]');
    this.loginButton     = page.locator('[data-test="login-button"]');
    this.productsTitle   = page.locator('.app_logo');
    this.burgerMenuButton= page.locator('#react-burger-menu-btn');
    this.logoutLink      = page.locator('#logout_sidebar_link');
  }

  async goto() {
    await this.page.goto('https://www.saucedemo.com/');
  }

  async login(user, pass) {
    await this.username.fill(user);
    await this.password.fill(pass);
    await this.loginButton.click();
  }

  async openMenu() {
    await this.burgerMenuButton.click();
  }

  async logout() {
    await this.logoutLink.click();
  }
}
