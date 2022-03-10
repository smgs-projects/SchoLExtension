import express from 'express'
import cors from 'cors'
import connection from "express-myconnection"

import mysql from 'mysql2'

const dbOptions = {
    host: "192.168.64.2",
    user: "silo",
    password: "g/H_jm0y36m88y]5",
    port: 3306,
    database: 'themes'
};

const app = express()

app.use(connection(mysql, dbOptions, 'pool'));
app.use(cors());
app.use(express.json())
const SQLConnection = (mysql.createPool(dbOptions)).promise()

const port = 3000
app.get("/getusertheme/:userid", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try { 
            let [user] = await promisePool.execute("SELECT * FROM userthemes WHERE user = ?", [req.params.userid]);
            if (user[0]) {
                res.status(200).send(user[0]["theme"]);
            }
            else {res.status(200).send(false)}
        } 
        catch(error) { return res.send(500).send("internal server error"); }
    })
})
app.post("/setusertheme/", async function(req, res, next) {
    req.getConnection(async function(err, connection) {
        if (err) return next(err);
        const promisePool = connection.promise();
        try { 
            const user = req.body["user"]
            const theme = req.body["theme"]
            if (!theme) {res.status(403).send("Theme is not defined"); return}
            if (user) {
                const [userfound] = await promisePool.execute("SELECT * FROM userthemes WHERE user = ?", [user]);
                if (userfound[0]) {
                    await promisePool.execute("UPDATE userthemes SET theme = ? WHERE userid = ${user};");
                }
                else {
                    await promisePool.execute(`INSERT INTO userthemes (userid, themes) VALUES (${user}, ${theme});`);
                }
            }
            else {
                res.status(403).send("User is not defined")
            }
        } 
        catch(error) {res.send(500).send("internal server error");return; }
        // eturn res.send(500).send("internal server error")
    })
})
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
function guidGenerator() {
    var S4 = function() {
       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}