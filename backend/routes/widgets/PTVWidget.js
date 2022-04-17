import express from "express";

import ptv from "ptv-api"

const devid = 3001454
const apikey = "fd02023d-0446-40d1-ae96-4b7be4a7b7e2"


const ptvClient = ptv(devid, apikey); 

const router = express.Router()

let routes = {}
const stops = {
    "windsor": {
        name: "Windsor_Station",
        stop_id: 1214,
        route_id: 12,
        route_type: 0
    },
    "tram_64": {
        name: "Tram_64",
        stop_id: 2604,
        route_id: 909,
        route_type: 1
    },
    "tram_5": {
        name: "Tram_5",
        stop_id: 2604,
        route_id: 1083,
        route_type: 1
    },
    "tram_78": {
        name: "Tram_78",
        stop_id: 2344,
        route_id: 976,
        route_type: 1
    }
}
setInterval(ReCache, 60000)
async function ReCache() {
    for (const stationname of Object.keys(stops)) {
        const station = stops[stationname]
        const departures = (await (await ptvClient).Departures.Departures_GetForStop({stop_id: station["stop_id"], route_id: station["route_id"], route_type: station["route_type"]})).body
        departures.departures = departures.departures.filter(item => item.route_id === station["route_id"])
        const directions = (await (await ptvClient).Directions.Directions_ForRoute({route_id: station["route_id"]})).body
        routes[station["name"]] = {}
        routes[station["name"]]["directions"] = {}
        routes[station["name"]]["departures"] = {}
        for (const direction of directions.directions) {
            routes[station["name"]]["directions"][direction["direction_id"]] = {"name": direction["direction_name"]}
        }
        let i = 0
        for (const departure of departures.departures.filter(departure => new Date(departure.scheduled_departure_utc).getTime() > new Date().getTime())) {

            if (!routes[station["name"]]["departures"][departure.direction_id] || routes[station["name"]]["departures"][departure.direction_id] === undefined) routes[station["name"]]["departures"][departure.direction_id] = []
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
            routes[station["name"]]["departures"][departure.direction_id][i]["disruption"] = departure.disruption_ids.length !== 0
            i++
        }
        for (const station of Object.keys(routes)) {
            for (const direction of Object.keys(routes[station].departures)) {
                routes[station].departures[direction] = routes[station].departures[direction].filter(item => item)
            }
        }
        
    }
}

router.get('/getdata', (req, res) => {
    let respondJSON = {}
    for (const routename of Object.keys(routes)) {
        respondJSON[routename] = Array(Object.keys(routes[routename].departures).length).fill(1).map((item, i) => routes[routename].departures[Object.keys(routes[routename].departures)[i]][0])
    }
    res.send(respondJSON)
})


export {router}
//Important for seb debugging no remove
// ptvClient.then(apis => {
//     return apis.Stops.Stops_StopsForRoute({ route_id: 976, route_type: 1 });
// }).then(res => {
//     console.log(res.body);
// }).catch(console.error);