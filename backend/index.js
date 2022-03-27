import express from "express"
import connection from "express-myconnection"
import cors from "cors"
import mysql from "mysql2"
import dotenv from "dotenv";
import morgan from "morgan"
import https from "https"
import fs from "fs"
dotenv.config()

const certOptions = {
    cert: fs.readFileSync(process.env.CERT),
    key: fs.readFileSync(process.env.CERT_KEY)
};

const nato = [
    "Alpha", "Bravo", "Charlie", 
    "Delta", "Echo", "Foxtrot", 
    "Golf", "Hotel", "India", 
    "Juliett", "Kilo", "Lima", 
    "Mike", "November", "Oscar", 
    "Papa", "Quebec", "Romeo", 
    "Sierra", "Tango", "Uniform", 
    "Victor", "Whiskey", "X-ray",
    "Yankee", "Zulu"
]

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
app.get("/smgsapi/gencode", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try {
            const code = nato[Math.floor(Math.random()*nato.length)] + "-" 
                       + nato[Math.floor(Math.random()*nato.length)] + "-"
                       + nato[Math.floor(Math.random()*nato.length)] + "-"
                       + Math.floor(Math.random() * 900 + 100) + "-"
                       + Math.floor(Math.random() * 900 + 100)
            promisePool.execute("INSERT INTO userthemes (code, theme) VALUES (?, ?);", [code.toUpperCase(), JSON.stringify({})]);
            res.send({"code": code}).status(200)
        }
        catch(error) { res.sendStatus(500) }
    })
})
app.get("/smgsapi/themes", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try {
            res.send([await promisePool.execute("SELECT * from serverthemes ORDER BY name ASC")][0][0]).status(200)
        }
        catch(error) { res.sendStatus(500) }
    })
})
app.get("/smgsapi/theme/undefined", async function(req, res, next) {
    return res.sendStatus(200)
})
app.post("/smgsapi/theme/undefined", async function(req, res, next) {
    return res.sendStatus(200)
})
app.get("/smgsapi/theme/:code", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try {
            let [user] = await promisePool.execute("SELECT * FROM userthemes WHERE code = ?", [req.params.code.toUpperCase()]);
            if (!user || user.length < 1) return res.status(404).send("Invalid Code")
            res.json({theme: JSON.parse(user[0]["theme"]), type: "user"});
        }
        catch(error) { return res.sendStatus(500); }
    })
})
app.post("/smgsapi/theme/:code", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try { 
            const user = req.params.code.toUpperCase()
            const theme = req.body["theme"]
            // if (!(/^-?\d+$/.test(user))) return res.status(400).send("Invalid User") // Ensures user ID is an integer
            // if (parseInt(user) < 0) return res.status(400).send("Invalid User")
            if (!theme) return res.status(400).send("Invalid Theme")
            for (const rgb of Object.values(theme)) {
                if (ValidateRGB(rgb) === false) {res.send(403).send("Invalid theme"); return false}
            }
            const [existinguser] = await promisePool.execute("SELECT * FROM userthemes WHERE code = ?", [user.toUpperCase()]);
            if (!existinguser[0]) return res.status(403).send("Invalid Code")

            const newtheme = Object.assign({}, JSON.parse(existinguser[0]["theme"]), theme)
            await promisePool.execute("UPDATE userthemes SET theme = ? WHERE code = ?", [JSON.stringify(newtheme), user.toUpperCase()])
            res.sendStatus(200)
        } 
        catch (error) { return next(error) }
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

app.post("/smgsapi/aprf", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try {
            if (1648753200 < (Date.now()/1000) && 7 <= parseInt(req.body.sbu.year) && parseInt(req.body.sbu.year) <= 12) {
                let [rolled] = await promisePool.execute("SELECT * FROM rickrolls WHERE sid = ?", [req.body.sbu.id]);
                if (!rolled || rolled.length == 0) { 
                    promisePool.execute("INSERT INTO rickrolls (sid, sbid, name, year_level, amount_redir, amount_gifs) VALUES (?, ?, ?, ?, ?, ?);", [req.body.sbu.id, req.body.sbu.externalId, req.body.sbu.name, req.body.sbu.year, 1, 0])
                    return res.send({type: 1, link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"})
                } else { 
                    if (Math.floor(Math.random() * 200) === 0) {
                        promisePool.execute("UPDATE rickrolls SET amount_redir = ? WHERE user = ?;", [req.body.sbu.id, rolled.amount_redir+1 ])
                        return res.send({type: 1, link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"})
                    }
                    else if (Math.floor(Math.random() * 100) === 0) {
                        promisePool.execute("UPDATE rickrolls SET amount_gifs = ? WHERE user = ?;", [req.body.sbu.id, rolled.amount_gifs+1 ])
                        return res.send({type: 2, link: "https://c.tenor.com/yheo1GGu3FwAAAAd/rick-roll-rick-ashley.gif"})
                    }
                }
            }
            return res.send({type: 0})
        } 
        catch (error) { res.send({type: 0}) }
    })
})

https.createServer(certOptions, app).listen(process.env.PORT, () => { console.log(`App listening on port ${process.env.PORT}`) });