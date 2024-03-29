const axios = require("axios");
const readlineSync = require("readline-sync")
const { readFile, writeFile } = require("node:fs/promises")

const host = "https://account-public-service-prod.ol.epicgames.com"

async function login() {
    try {
        const auth =  JSON.parse(await readFile('./deviceAuth.json', "utf8"));
        return auth
    } catch (e) {
        const URL = "https://www.epicgames.com/id/api/redirect?clientId=3446cd72694c4a4485d81b77adbb2141&responseType=code";
        const mensaje = `Auth code: `;
        const authcode = readlineSync.question(mensaje);
        const post = {
            url: `${host}/account/api/oauth/token`,
            data: {
                grant_type: "authorization_code",
                code: authcode
            },
            config: {
                headers: {
                    Authorization: "basic MzQ0NmNkNzI2OTRjNGE0NDg1ZDgxYjc3YWRiYjIxNDE6OTIwOWQ0YTVlMjVhNDU3ZmI5YjA3NDg5ZDMxM2I0MWE=",
                    "Content-Type" : "application/x-www-form-urlencoded",
                    'User-Agent': ';)',
                }
            }
        }
        let respuesta = await axios.post(post.url, post.data, post.config);
        const c = {
            url: `${host}/account/api/public/account/${respuesta.data.account_id}/deviceAuth`,
            body: "",
            config: {
                headers: {
                    'Content-Type': `application/json`,
                    'Authorization': `Bearer ${respuesta.data.access_token}`,
                    'Accept': 'application/json, text/plain, */*',
                    'User-Agent': ';)',
                    'Accept-Encoding': 'gzip, compress, deflate, br',
                    'Host': 'account-public-service-prod.ol.epicgames.com'
                }
            }
        }
        respuesta = await axios.post(c.url, c.body, c.config);
        const device = {
            deviceId: respuesta.data.deviceId,
            accountId: respuesta.data.accountId,
            secret: respuesta.data.secret
        }
        writeFile("./deviceAuth.json", JSON.stringify(device, null, 2))
        .then(async () => {
            console.log("Tu cuenta ha sido guardada\nLa proxima vez que lo ejecutes deberas estar en el paso 2");
            const auth =  JSON.parse(await readFile('./deviceAuth.json', "utf8"));
            return auth;
        })
    }
}

async function get_access_token() {
    try {
        const device = await login();
        const post = {
            url: "https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token",
            data: {
                grant_type: "device_auth",
                account_id: device.accountId,
                device_id: device.deviceId,
                secret: device.secret
            },
            config: {
                headers: {
                    Authorization: "basic MzQ0NmNkNzI2OTRjNGE0NDg1ZDgxYjc3YWRiYjIxNDE6OTIwOWQ0YTVlMjVhNDU3ZmI5YjA3NDg5ZDMxM2I0MWE=",
                    "Content-Type" : "application/x-www-form-urlencoded",
                    'User-Agent': ';)'
                }
            }
        }
    var respuesta = await axios.post(post.url, post.data, post.config);
    return [respuesta.data.access_token, respuesta.data.account_id]
    } catch (error) {console.error("El auth code no es válido")}
}


(async () => {
    try {
        let access_token = await get_access_token()
        const c = {
            url: `https://fngw-mcp-gc-livefn.ol.epicgames.com/fortnite/api/game/v2/profile/${access_token[1]}/client/QueryProfile?profileId=campaign&rvn=-1`,
            data: {},
            config: {
                headers: {
                    Authorization: `Bearer ${access_token[0]}`,
                    "Content-Type" : "application/json",
                    'User-Agent': ';)'
                }
            }
        }
        let respuesta = await axios.post(c.url, c.data, c.config);
        const items = respuesta.data.profileChanges[0].profile.items;
        const valores = Object.values(items);
        const item = valores.filter((l) => l.templateId.startsWith("CampaignHero"));
        
        for (let i = 0; i < 3; i++) {
            for (let index = 0; index < item.length; index++) {
                let access_token = await get_access_token();
                let  element = item[index];
                const key = Object.entries(items).find(([key, value]) => value === element)?.[0];
                const c = {
                    url: `https://fngw-mcp-gc-livefn.ol.epicgames.com/fortnite/api/game/v2/profile/${access_token[1]}/client/SetActiveHeroLoadout?profileId=campaign&rvn=-1`,
                    data: {"selectedLoadout": key},
                    config: {
                        headers: {
                            Authorization: `Bearer ${access_token[0]}`,
                            "Content-Type" : "application/json",
                            'User-Agent': ';)'
                        }
                    }
                }
                axios.post(c.url, c.data, c.config);
            }
        }
        console.log("Abandona por el estandarte\n/(La proxima vez que lo ejecutes empieza por el paso 2)")
    } catch (error) {
        if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined")) {}
        else  {console.error(error)}

    }
})()