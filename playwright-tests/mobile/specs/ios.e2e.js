describe('iOS smoke', () => {
    it('Lunch iOS App and perform search', async () => {
        const skipButton = await driver.$("-ios class chain:**/XCUIElementTypeButton[`name == \"Skip\"`]");
        if (await skipButton.isDisplayed()) {
            await skipButton.click();
            console.log("iOS - Skip button clicked");
        }
        
        const searchButton = await driver.$("accessibility id:Search Wikipedia");
        await searchButton.click();
        console.log("iOS - Search Wikipedia button clicked");

        const searchField = await driver.$("accessibility id:Search Wikipedia");
        await searchField.addValue("Test");
        console.log("iOS - Entered text in search field");

        const option1 = await driver.$("accessibility id:Topics referred to by the same term");
        await option1.click();
        console.log("iOS - Option 1 clicked");

        const backButton = await driver.$("accessibility id:Back");
        await backButton.click();
        console.log("iOS - Back button clicked");


        const cancelSearchButton = await driver.$("-ios class chain:**/XCUIElementTypeStaticText[`name == \"Cancel\"`]");
        await cancelSearchButton.click();
        console.log("iOS - Cancel search button clicked");

        const historyTab = await driver.$("accessibility id:History");
        await historyTab.click();
        console.log("iOS - History tab clicked");

        await browser.pause(5000); // Wait for history to load
        
        await browser.deleteSession();
    });
});