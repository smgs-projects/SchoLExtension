import express from "express"
import connection from "express-myconnection"
import cors from "cors"
import mysql from "mysql2"
import dotnev from "dotenv";

dotnev.config()
const nato =  {
    "A": "Alpha",  "B": "Bravo",   "C": "Charlie",
    "D": "Delta",  "E": "Echo",    "F": "Foxtrot",
    "G": "Golf",   "H": "Hotel",   "I": "India",
    "J": "Juliett","K": "Kilo",    "L": "Lima",
    "M": "Mike",   "N": "November","O": "Oscar",
    "P": "Papa",   "Q": "Quebec",  "R": "Romeo",
    "S": "Sierra", "T": "Tango",   "U": "Uniform",
    "V": "Victor", "W": "Whiskey", "X": "X-ray",
    "Y": "Yankee", "Z": "Zulu"
}



const app = express()

app.use(connection(mysql, {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
 }, "pool"));

app.use(cors());
app.use(express.json())



app.get("/gencode", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try {
            const code = Object.values(nato)[Math.floor(Math.random()*Object.keys(nato).length)] + "-"+ Object.values(nato)[Math.floor(Math.random()*Object.keys(nato).length)] +"-"+ Object.values(nato)[Math.floor(Math.random()*Object.keys(nato).length)] + "-" + getRandomArbitrary(100, 1000)+ "-" + getRandomArbitrary(100, 1000)
            promisePool.execute("INSERT INTO userthemes (code, theme) VALUES (?, ?);", [code, JSON.stringify({})]);
            res.send({"code": code}).status(200)
        }
        catch(error) { res.status(501).send("Internal server error") }
    })
})
app.get("/gettheme/:code", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try {
            let [user] = await promisePool.execute("SELECT theme FROM userthemes WHERE code = ?", [req.params.code]);
            if (!user || user.length < 1) return res.status(404).send("Unknown User")
            res.json(user[0]["theme"]);
        }
        catch(error) { return res.send(500); }
    })
})
app.post("/settheme/:code", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try { 
            const user = req.params.code
            const theme = req.body["theme"]
            // if (!(/^-?\d+$/.test(user))) return res.status(400).send("Invalid User") // Ensures user ID is an integer
            // if (parseInt(user) < 0) return res.status(400).send("Invalid User")
            if (!theme) return res.status(400).send("Invalid Theme")
            const [existinguser] = await promisePool.execute("SELECT * FROM userthemes WHERE code = ?", [user]);
            if (!existinguser[0])  {res.send(403).status("could not find code");return}
            for (const key of Object.keys(JSON.parse(existinguser[0]["theme"]))) {
                console.log(key)
                if (!theme[key] && JSON.parse(existinguser[0]["theme"])[key] !== undefined) theme[key] = JSON.parse(existinguser[0]["theme"])[key]
            }  
            await promisePool.execute("UPDATE userthemes SET theme = ? WHERE code = ?", [JSON.stringify(theme), user])
            res.sendStatus(200)
        } 
        catch (error) { return next(error) }
    })
})
app.listen(process.env.PORT, () => { console.log(`App listening on port ${process.env.PORT}`) })
function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min) + min)
}