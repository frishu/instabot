const puppeteer = require('puppeteer');
const fs = require('fs');
const config = require(__dirname + '/../modules/config');

(async () => {
    const browser = await puppeteer.launch({

        //args: ['--disable-features=site-per-process', '--lang=en-GB'],
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=en-GB'],
        headless: true,
        devtools: false,

    });

    const unfollow = (await browser.pages())[0];

    await unfollow.goto('https://www.instagram.com/accounts/login/?source=auth_switcher');
    await unfollow.waitFor('form');
    await unfollow.type('input[name="username"]', config.username);
    await unfollow.type('input[name="password"]', config.password);
    await unfollow.click('button[type="submit"]', { delay: 1000 });

    await unfollow.waitForNavigation();

    await config.insertJQuery(unfollow);
    if (unfollow.url() == "https://www.instagram.com/#reactivated") {
        await unfollow.evaluate(() => {
            $('a:contains(Not Now)')[0].click();
        });
    }

    await new Promise(r => setTimeout(r, 1000));

    await unfollow.evaluate(() => {
        if ($('h2:contains(Turn on Notifications)')[0]) {
            $('button:contains(Not Now)')[0].click();
        }
    });

    await unfollow.bringToFront();

    let toUnfollow = await fs.readFileSync(__dirname + '/toUnfollow.json').toString();
    toUnfollow = await JSON.parse(toUnfollow);

    let unfollowed = await fs.readFileSync(__dirname + '/unfollowed.json').toString();
    unfollowed = await JSON.parse(unfollowed);

    for(let nick in toUnfollow) {

        if(unfollowed[nick] != null) {
            unfollowed[nick] = true;
            continue;
        }

        if(!await unfollow.goto('https://www.instagram.com/' + nick + '/')) {
            continue;
        }

        await config.insertJQuery(unfollow);
        let statusUnfollowed = await unfollow.evaluate(async() => {

            let unfollowed = 0;
            if($("button:contains(Following)")[0]) {
                $("button:contains(Following)")[0].click();
                await new Promise(r => setTimeout(r, 500));
                $("button:contains(Unfollow)")[0].click();
                unfollowed = 1;
            }

            return unfollowed;

        });

        unfollowed[nick] = true;
        fs.writeFileSync(__dirname + '/unfollowed.json', JSON.stringify(unfollowed, null, 2));

        if(statusUnfollowed === 1) {
            await new Promise(r => setTimeout(r, 58000));
        }
    }

    process.exit();
})();
