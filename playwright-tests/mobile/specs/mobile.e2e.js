describe('Android smoke', () => {
    it('should launch app, skip the welcome screen and show home', async () => {
        const skipBtn = await $('android=new UiSelector().text("Skip for Now")');
        if (await skipBtn.isDisplayed()) {
            await skipBtn.click();
            console.log("Device - Skip for Now button clicked");
        }
        const popup = await $("accessibility id:Close");
        if (await popup.isDisplayed()) {
            await popup.click();
            console.log("Device - popup Close button clicked");
        }
        const signInPortalButton = await $("id:com.sephora:id/sephora_button_container");
        await signInPortalButton.click();
        console.log("Device - Sign In Portal button clicked");
        const emailInputField = await $("id:com.sephora:id/edit_text_email");
        await emailInputField.addValue("autotestsuite@yopmail.com");
        console.log("Device - Entered email in email input field");
        const passwordField = await $("id:com.sephora:id/edit_text_password");
        await passwordField.addValue("123456");
        console.log("Device - Entered password in password field");
        const loginButton = await $("id:com.sephora:id/login_button_init_text");
        await loginButton.click();
        console.log("Device - Login button clicked");
        await browser.pause(5000); // Wait for login to complete
        console.log("Device - Login completed");
        await browser.deleteSession();
    });
});