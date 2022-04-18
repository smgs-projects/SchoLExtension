import express from "express";
import connection from "express-myconnection";
import cors from "cors";
import mysql from "mysql2";
import dotenv from "dotenv";
import morgan from "morgan";
import https from "https";
import fs from "fs";
import sha1 from "sha1";
import jwt from "jsonwebtoken";
import path from "path";
dotenv.config();

const __dirname = path.resolve();

const valid_pronouns = {
    "hehim" : "He/Him",
    "sheher": "She/Her",
    "theythem": "They/Them",
    "other": "Ask Me"
}

const certOptions = {
    cert: fs.readFileSync(process.env.CERT),
    key: fs.readFileSync(process.env.CERT_KEY)
};

const app = express()

app.use(connection(mysql, {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
}, "pool"));

app.use(morgan(':method :url :status :res[content-length] - :response-time ms - :remote-addr'));
app.use(cors());
app.use(express.json())

app.get("/smgsapi/compiled.js", async function (req, res, next) {
    res.sendFile(path.resolve(__dirname, '..', 'compiled.js'));
})
app.get("/smgsapi/themes", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try {
            res.send([await promisePool.execute("SELECT * from serverthemes ORDER BY name ASC")][0][0]).status(200)
        }
        catch(error) { console.error(error); res.sendStatus(500); }
    })
})
app.get("/smgsapi/theme", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try {
            let tokenData;
            try { tokenData = jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRET) }
            catch { return res.sendStatus(403); }

            let [theme] = await promisePool.execute("SELECT * FROM themes WHERE id = ?", [tokenData.id]);
            if (!theme || theme.length < 1) return res.json({})
            res.json({theme: JSON.parse(theme[0]["theme"]), settings: JSON.parse(theme[0]["settings"])});
        }
        catch(error) { console.error(error); return res.sendStatus(500); }
    })
})
app.post("/smgsapi/theme", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try { 
            let tokenData;
            try { tokenData = jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRET) }
            catch { return res.sendStatus(403); }

            const defaultTheme = req.body["defaultTheme"]
            const theme = req.body["theme"]
            const settings = req.body["settings"]
            if (!settings && settings !== false) return res.sendStatus(400)
            if (!theme && theme !== false) return res.sendStatus(400)
            for (const subject of Object.values(theme)) {
                if (ValidateRGB(subject.color) === false) return res.sendStatus(400)
            }
            settings.pronouns.selected = settings.pronouns.selected.filter(e => valid_pronouns[e])
            if (settings.pronouns.show.length != 3) settings.pronouns.show = [1, 1, 1]

            const [existingtheme] = await promisePool.execute("SELECT * FROM themes WHERE id = ?", [tokenData.id]);
            if (!existingtheme || existingtheme.length < 1) { 
                promisePool.execute("INSERT INTO themes (id, sbid, sbu, defaults, theme, settings) VALUES (?, ?, ?, ?, ?, ?);", [tokenData.id, req.body.sbu.id, JSON.stringify(req.body.sbu), JSON.stringify(defaultTheme), JSON.stringify(theme), JSON.stringify(settings)]);
            } else {
                await promisePool.execute("UPDATE themes SET sbu = ?, sbid = ?, defaults = ?, theme = ?, settings = ? WHERE id = ?", [JSON.stringify(req.body.sbu), req.body.sbu.id, JSON.stringify(defaultTheme), JSON.stringify(theme), JSON.stringify(settings), tokenData.id]);
            }
            res.sendStatus(200)
        } 
        catch (error) { console.error(error); return res.sendStatus(500); }
    })
})
app.get("/smgsapi/pronouns/:userid", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try { 
            let tokenData;
            try { tokenData = jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRET) }
            catch { return res.sendStatus(403); }

            const [reqTheme] = await promisePool.execute("SELECT * FROM themes WHERE id = ?", [tokenData.id]);
            const [userTheme] = await promisePool.execute("SELECT * FROM themes WHERE sbid = ?", [req.params.userid]);
            if (!reqTheme || reqTheme.length < 1) return res.send("[]")
            if (!userTheme || userTheme.length < 1) return res.send("[]")

            let sbu = JSON.parse(reqTheme[0]["sbu"])
            let userSettings = JSON.parse(userTheme[0]["settings"])
            if (userSettings.pronouns.show[sbu.role.student ? 0 : sbu.role.staff ? 1 : 2] || req.params.userid == sbu.id) {
                return res.send(userSettings.pronouns.selected.map(e => valid_pronouns[e]))
            }
            return res.send("[]")
        } 
        catch (error) { console.error(error); return res.sendStatus(500); }
    })
})
function ValidateRGB(rgb) {
    try {
        if (!rgb.startsWith('rgb(')) return false;
        if (!rgb.endsWith(')')) return false;
        const colours = (rgb.substring(4, rgb.length-1)).split(", ")
        if (colours.length === 3) {
            for (const colour of colours) {
                if (parseInt(colour) > 255 || parseInt(colour) < 0) return false
                for (const char of colour) {
                    if (!Number.isInteger(parseInt(char))) return false
                }
            }
            return true
        }
        else {return false}
    } catch {
        return false
    }
}

// SchoolBox 3rd Party Integration
app.get("/smgsapi/auth", async function (req, res, next) {
    if (sha1(process.env.REMOTE_API_SECRET + req.query.time + req.query.id) !== req.query.key) {
        return res.sendStatus(401);
    }
    res.json({token: jwt.sign({id: req.query.id, user: req.query.user}, process.env.SECRET)});
})

// Tools Redirect
app.all("*", function(req, res) {
    res.redirect(301, "https://tools.robocupjunior.org.au"  + req.url);
})    

https.createServer(certOptions, app).listen(process.env.PORT, () => { console.log(`App listening on port ${process.env.PORT}`) });
