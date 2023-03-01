import express from "express";
import connection from "express-myconnection";
import cors from "cors";
import mysql from "mysql2";
import dotenv from "dotenv";
import morgan from "morgan";
import http from "http";
import https from "https";
import fs from "fs";
import sha1 from "sha1";
import jwt from "jsonwebtoken";
import path from "path";
dotenv.config();

const SERVER_VERSION = 2;

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

import {router as ptv} from "./routes/widgets/PTVWidget.js"

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
app.set("trust proxy", true)
app.use('/scholext/ptv', ptv)

app.get("/scholext/compiled.js", async function (req, res, next) {
    res.sendFile(path.resolve(__dirname, '..', 'compiled.js'));
})
app.get("/scholext/themes", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try {
            res.send([await promisePool.execute("SELECT * from serverthemes ORDER BY name ASC")][0][0]).status(200)
        }
        catch(error) { console.error(error); res.sendStatus(500); }
    })
})

app.get("/scholext/config", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try {
            let tokenData;
            try { tokenData = jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRET) }
            catch { return res.sendStatus(403); }

            let [config] = await promisePool.execute("SELECT * FROM configs WHERE id = ?", [tokenData.id]);
            if (!config || config.length < 1) return res.json({updated: 0, version: SERVER_VERSION})

            let userConfig = JSON.parse(config[0]["config"]);
            // FANCY STUFF TO ENSURE USERCONFIG IS UP TO DATE GOES HERE]
                // IF ANY UPDATES OCCUR, SET userConfig.updated = Date.now();
            userConfig.version = SERVER_VERSION;
            return res.json(userConfig);
        }
        catch(error) { console.error(error); return res.sendStatus(500); }
    })
})
app.post("/scholext/config", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try { 
            let tokenData;
            try { tokenData = jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRET) }
            catch { return res.sendStatus(403); }

            const userConfig = req.body["config"]
            if (!userConfig && userConfig !== false) return res.sendStatus(400)
            if (userConfig.version != SERVER_VERSION) return res.status(400).send("Version Mismatch")
            for (const subject of Object.values(userConfig.theme)) {
                if (ValidateRGB(subject.color) === false) return res.status(400).send("Invalid RGB")
            }
            userConfig.pronouns.selected = userConfig.pronouns.selected.filter(e => valid_pronouns[e])
            if (userConfig.pronouns.show.length != 3) userConfig.pronouns.show = [1, 1, 1]

            const [existingtheme] = await promisePool.execute("SELECT * FROM configs WHERE id = ?", [tokenData.id]);
            if (!existingtheme || existingtheme.length < 1) { 
                promisePool.execute("INSERT INTO configs (id, sbid, role, config) VALUES (?, ?, ?, ?);", [tokenData.id, req.body.sbu.id, req.body.sbu.role.student ? 0 : req.body.sbu.role.staff ? 1 : 2, JSON.stringify(userConfig)]);
            } else {
                await promisePool.execute("UPDATE configs SET sbid = ?, role = ?, config = ? WHERE id = ?", [req.body.sbu.id, req.body.sbu.role.student ? 0 : req.body.sbu.role.staff ? 1 : 2, JSON.stringify(userConfig), tokenData.id]);
            }
            res.sendStatus(200)
        }
        catch (error) { console.error(error); return res.sendStatus(500); }
    })
})
app.get("/scholext/pronouns/:userid", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try { 
            let tokenData;
            try { tokenData = jwt.verify(req.headers.authorization.split(" ")[1], process.env.SECRET) }
            catch { return res.sendStatus(403); }

            const [reqTheme] = await promisePool.execute("SELECT * FROM configs WHERE id = ?", [tokenData.id]);
            const [userTheme] = await promisePool.execute("SELECT * FROM configs WHERE sbid = ?", [req.params.userid]);
            if (!reqTheme || reqTheme.length < 1) return res.send("[]")
            if (!userTheme || userTheme.length < 1) return res.send("[]")
            let userConfig = JSON.parse(userTheme[0].config)
            if (userConfig.pronouns.show[parseInt(reqTheme[0].role)] || req.params.userid == reqTheme[0].sbid) {
                return res.send(userConfig.pronouns.selected.map(e => valid_pronouns[e]))
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
app.get("/scholext/auth", async function (req, res, next) {
    if (sha1(process.env.REMOTE_API_SECRET + req.query.time + req.query.id) !== req.query.key) {
        return res.sendStatus(401);
    }
    res.json({token: jwt.sign({id: req.query.id, user: req.query.user}, process.env.SECRET)});
})

if (process.env.USE_HTTPS != "false") {
    http.createServer((req, res) => {
        res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
        res.end();
    }).listen(process.env.HTTP_PORT);
    https.createServer(certOptions, app).listen(process.env.HTTPS_PORT, () => { console.log(`App listening on port ${process.env.HTTPS_PORT}`) });
} else {
    app.listen(process.env.HTTP_PORT);
} 