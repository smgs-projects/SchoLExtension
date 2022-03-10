import express from "express"
import connection from "express-myconnection"
import cors from "cors"
import mysql from "mysql2"
import { config as envConfig } from "dotenv";

envConfig();

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

app.get("/theme/:userid", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try {
            let [user] = await promisePool.execute("SELECT theme FROM userthemes WHERE user = ?", [req.params.userid]);
            if (!user || user.length < 1) return res.status(404).send("Unknown User")
            res.json(user[0]["theme"]);
        }
        catch(error) { return res.send(500); }
    })
})

app.post("/theme/:userid", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try { 
            const user = req.params.userid
            const theme = req.body["theme"]
            if (!(/^-?\d+$/.test(user))) return res.status(400).send("Invalid User") // Ensures user ID is an integer
            if (parseInt(user) < 0) return res.status(400).send("Invalid User")
            if (!theme) return res.status(400).send("Invalid Theme")

            const [existinguser] = await promisePool.execute("SELECT user FROM userthemes WHERE user = ?", [user]);
            if (existinguser.length < 1) { 
                await promisePool.execute("INSERT INTO userthemes (user, theme) VALUES (?, ?)", [user, JSON.stringify(theme)]);
            } else {
                await promisePool.execute("UPDATE userthemes SET theme = ? WHERE user = ?", [JSON.stringify(theme), user])
            }
            res.sendStatus(200)
        } 
        catch (error) { return next(error) }
    })
})

app.listen(process.env.PORT, () => { console.log(`App listening on port ${process.env.PORT}`) })
