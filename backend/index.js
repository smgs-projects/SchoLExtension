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

app.get("/gencode", async function(req, res, next) {
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
        catch(error) { res.status(501).send("Internal server error") }
    })
})
app.get("/theme/:code", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try {
            let [customthemes] = await promisePool.execute("SELECT * FROM serverthemes WHERE name = ?", [req.params.code.toUpperCase()]);

            if (customthemes[0]) {
                res.send({theme: JSON.parse(customthemes[0]["theme"]), type: "server"}).status(200)
                return;
            }
            let [user] = await promisePool.execute("SELECT * FROM userthemes WHERE code = ?", [req.params.code.toUpperCase()]);
            if (!user || user.length < 1) return res.status(404).send("Unknown User")
            res.json({theme: JSON.parse(user[0]["theme"]), type: "user"});
        }
        catch(error) { return res.send(500); }
    })
})
app.post("/theme/:code", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try { 
            const user = req.params.code.toUpperCase()
            const theme = req.body["theme"]
            // if (!(/^-?\d+$/.test(user))) return res.status(400).send("Invalid User") // Ensures user ID is an integer
            // if (parseInt(user) < 0) return res.status(400).send("Invalid User")
            if (!theme) return res.status(400).send("Invalid Theme")
            const [existinguser] = await promisePool.execute("SELECT * FROM userthemes WHERE code = ?", [user.toUpperCase()]);
            if (!existinguser[0]) return res.status(403).send("Invalid Code")
            for (const key of Object.keys(JSON.parse(existinguser[0]["theme"]))) {
                if (!theme[key] && JSON.parse(existinguser[0]["theme"])[key] !== undefined) theme[key] = JSON.parse(existinguser[0]["theme"])[key]
            }  
            await promisePool.execute("UPDATE userthemes SET theme = ? WHERE code = ?", [JSON.stringify(theme), user.toUpperCase()])
            res.sendStatus(200)
        } 
        catch (error) { return next(error) }
    })
})

https.createServer(certOptions, app).listen(process.env.PORT, () => { console.log(`App listening on port ${process.env.PORT}`) });