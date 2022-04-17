import express from "express";

import ptv from "ptv-api"

const devid = 3001454
const apikey = "fd02023d-0446-40d1-ae96-4b7be4a7b7e2"


const ptvClient = ptv(devid, apikey); 

const router = express.Router()

let routes = {
    "Windsor_Station": {
        directions: {},
        departures: {}
    }
}
const stops = {
    "windsor": {
        name: "Windsor_Station",
        stop_id: 1214,
        route_id: 12,
        route_type: 0
    }
}
await ReCache()
async function ReCache() {
    for (const stationname of Object.keys(stops)) {
        const station = stops[stationname]
        const departures = (await (await ptvClient).Departures.Departures_GetForStop({stop_id: station["stop_id"], route_type: station["route_type"]})).body
        const directions = (await (await ptvClient).Directions.Directions_ForRoute({route_id: station["route_id"]})).body
        
        for (const direction of directions.directions) {
            routes[station["name"]]["directions"][direction["direction_id"]] = {"name": direction["direction_name"]}
        }
        let i = 0
        for (const departure of departures.departures.filter(departure => new Date(departure.scheduled_departure_utc).getTime() > new Date().getTime())) {
            if (!routes[station["name"]]["departures"][departure.direction_id]) routes[station["name"]]["departures"][departure.direction_id] = []
            routes[station["name"]]["departures"][departure.direction_id][i] = {}
            if (departure.estimated_departure_utc) {
                routes[station["name"]]["departures"][departure.direction_id][i]["time"] = Math.ceil((new Date(departure.scheduled_departure_utc).getTime() - new Date().getTime())/60000)
                routes[station["name"]]["departures"][departure.direction_id][i]["delayed"] = true
            }
            else {
                routes[station["name"]]["departures"][departure.direction_id][i]["time"] = Math.ceil((new Date(departure.scheduled_departure_utc).getTime() - new Date().getTime())/60000)
                routes[station["name"]]["departures"][departure.direction_id][i]["delayed"] = false
            }
            routes[station["name"]]["departures"][departure.direction_id][i]["direction_name"] = routes[station["name"]]["directions"][departure.direction_id].name
            routes[station["name"]]["departures"][departure.direction_id][i]["boarding"] = departure.at_platform
            i++
        }
        for (const direction of Object.keys(routes.Windsor_Station.departures)) {
            routes.Windsor_Station.departures[direction] = routes.Windsor_Station.departures[direction].filter(item => item)
        }
    }
}

router.get('/getdata', (req, res) => {
    res.send({"Windsor_Station": Array(Object.keys(routes.Windsor_Station.departures).length).fill(1).map((item, i) => routes.Windsor_Station.departures[Object.keys(routes.Windsor_Station.departures)[i]][0])})
})



// GetStops()
// async function GetStops() {
//     const signiture = crypto.HmacSHA1(nearmeurl, process.env.API_KEY).toString()
//     const url = `http://timetableapi.ptv.vic.gov.au/v2/nearme/latitude/-37.85936836743422/longitude/144.99169329908827?devid=${process.env.USER_ID}?signiture=${signiture}`
//     console.log(await fetch(url))
// }
// async function HealthCheck() {
//     const signiture = hmacSHA1(healthurl, process.env.API_KEY)
//     const url = `http://timetableapi.ptv.vic.gov.au/v2/HealthCheck?devid=${process.env.USER_ID}?signiture=${signiture}`
//     console.log(await fetch(url))
// }

export {router}