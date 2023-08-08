import express from "express";
import dotenv from "dotenv";
import ptv from "ptv-api"
dotenv.config();

const ptvClient = ptv(process.env.PTV_DEV_ID, process.env.PTV_API_KEY); 

const router = express.Router()

let schedule = {}
let last_updated = 0;
const stops = {
    "sandringham": {
        name: "Sandringham",
        stop_id: 1214,
        route_id: 12,
        route_type: 0,
        colour: "#EC7EB0",
        prefix: "Windsor "
    },
    "tram_5": {
        name: "5",
        stop_id: 2604,
        route_id: 1083,
        route_type: 1,
        colour: "#D81933",
        prefix: "Stop 32 "
    },
    "tram_64": {
        name: "64",
        stop_id: 2604,
        route_id: 909,
        route_type: 1,
        colour: "#2BAA90",
        prefix: "Stop 32 "
    },
    "tram_78_BAL": {
        name: "78",
        stop_id: 2346,
        route_id: 976,
        route_type: 1,
        colour: "#9CBDAB",
        prefix: "Stop 41 "
    },
    "tram_78_NR": {
        name: "78",
        stop_id: 2347,
        route_id: 976,
        route_type: 1,
        colour: "#9CBDAB",
        prefix: "Stop 41 "
    }
}

reCache();
setInterval(reCache, 60000)
async function reCache() {
    try {
        let newSchedule = {} 
        for (const stationname of Object.keys(stops)) {
            const station = stops[stationname]
            
            for (const direction of (await (await ptvClient).Directions.Directions_ForRoute({route_id: station["route_id"]})).body.directions) {
                if (![[], undefined].includes(newSchedule[station.route_id + direction.direction_id]?.departures)) continue; 
                newSchedule[station.route_id + direction.direction_id] = {
                    "name": direction.direction_name, 
                    "route": station.name, 
                    "type": station.route_type, 
                    "colour": station.colour,
                    "prefix": station.prefix,
                    "departures": []
                }
            }
            let departures = (await (await ptvClient).Departures.Departures_GetForStop({stop_id: station["stop_id"], route_id: station["route_id"], route_type: station["route_type"]})).body
            for (const departure of departures.departures) {
                if (new Date(departure.scheduled_departure_utc).getTime() < new Date().getTime()) continue;
                if (departure.route_id !== station.route_id) continue;
                if (newSchedule[station.route_id + departure.direction_id].departures.length >= 5) continue;
                newSchedule[station.route_id + departure.direction_id].departures.push({
                    "scheduled_time": new Date(departure.scheduled_departure_utc).getTime(),
                    "estimated_time": new Date(departure.estimated_departure_utc).getTime(),
                    "platform": departure.platform_number,
                    "disruption": departure.disruption_ids.length !== 0
                })
            }
        }
        schedule = Object.keys(newSchedule).map(e => newSchedule[e]);
        last_updated = new Date().getTime();
    } catch (e) {
        console.error("PTV Error Detected, Passing")
        console.error(e.stack);
    }
}

router.get('/schedule', (req, res) => {
    return res.send({schedule: schedule, last_updated: last_updated, expires: last_updated + 61000})
})

export {router}
