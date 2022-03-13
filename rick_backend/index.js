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

app.get("/gotrickrolled/:user", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try {
            const user = JSON.parse(req.params["user"])
            let [rolled] = await promisePool.execute("SELECT * FROM rickastley WHERE name = ?", [user.externalId]);
            if (!rolled[0]) {promisePool.execute("INSERT INTO rickastley (user, amount_trolled, time_first_trolled, year_level) VALUES (?, ?, ?, ?);", [user.externalId, 0, Date.now(), user.role])}
            else {promisePool.execute("UPDATE rick_astley SET amount_trolled = ? WHERE user = ?;", [user.externalId, rolled.amount_trolled+1 ])}
            res.redirect("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
        }
        catch(error) { return res.send(500); }
    })
})
https.createServer(certOptions, app).listen(process.env.PORT, () => { console.log(`App listening on port ${process.env.PORT}`) });
// app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`)
//   })