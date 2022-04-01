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
dotenv.config();


const certOptions = {
    cert: fs.readFileSync(process.env.CERT),
    key: fs.readFileSync(process.env.CERT_KEY)
};

const validSettings = ["autoreload", "settingsync", "themesync", "colourduework", "compacttimetable"]

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
    res.sendFile("compiled.js", { root: "." });
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
function ValidateSettings(settings) {
    if (Object.keys(settings).filter(setting => validSettings.includes(setting)).length !== Object.values(settings).length) return false
    if (Object.values(settings).filter(value => value === true || value === false).length !== Object.values(settings).length) return false
    return true
}
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
            if (!settings) return res.sendStatus(400)
            if (!theme) return res.sendStatus(400)
            if (ValidateSettings(settings) === false) {
                return res.sendStatus(400)
            }
            for (const rgb of Object.values(theme)) {
                if (ValidateRGB(rgb) === false) return res.sendStatus(400)
            }
            const [existingtheme] = await promisePool.execute("SELECT * FROM themes WHERE id = ?", [tokenData.id]);
            if (!existingtheme || existingtheme.length < 1) { 
                promisePool.execute("INSERT INTO themes (id, sbu, defaults, theme, settings) VALUES (?, ?, ?, ?, ?);", [tokenData.id, JSON.stringify(req.body.sbu), JSON.stringify(defaultTheme), JSON.stringify(theme), JSON.stringify(settings)]);
            } else {
                await promisePool.execute("UPDATE themes SET sbu = ?, defaults = ?, theme = ?, WHERE id = ?", [JSON.stringify(req.body.sbu), JSON.stringify(defaultTheme), JSON.stringify(theme), JSON.stringify(settings), tokenData.id]);
            }
            res.sendStatus(200)
        } 
        catch (error) { console.error(error); return res.sendStatus(500); }
    })
})
function ValidateRGB(rgb) {
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
}

// SchoolBox 3rd Party Integration
app.get("/smgsapi/auth", async function (req, res, next) {
    if (sha1(process.env.REMOTE_API_SECRET + req.query.time + req.query.id) !== req.query.key) {
        return res.sendStatus(401);
    }
    res.json({token: jwt.sign({id: req.query.id, user: req.query.user}, process.env.SECRET)});
})

https.createServer(certOptions, app).listen(process.env.PORT, () => { console.log(`App listening on port ${process.env.PORT}`) });