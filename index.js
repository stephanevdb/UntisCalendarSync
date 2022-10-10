const WebUntisLib = require('webuntis');
const fs = require('fs')


const schedule = require("node-schedule");
const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const WebUntis = require("webuntis");

let config = JSON.parse(fs.readFileSync('config/config.json'))
console.log("waiting")
schedule.scheduleJob(config.schedule, () => {
    console.log("Running")
const calendar = google.calendar({ version: "v3" });

const auth = new GoogleAuth({
    keyFilename: 'config/google-credentials.json',
    scopes: ["https://www.googleapis.com/auth/calendar"]
})

const authClient = auth.getClient().then(() => {
    getCalEvents().then((events) => addEvents(events))
})


const classList = config.ClassList
const QRCodeData = config.Qr;
//date of tomorrow
let date = new Date();
date.setDate(date.getDate());
//begining of the week

const untis = new WebUntisLib.WebUntisQR(QRCodeData);

async function getClassID(classname) {
    await untis.login()
    const classes = await untis.getClasses()
    const ourClass = classes.filter(classElement => classElement.name === classname)[0]
    console.log(ourClass)
    return ourClass
}
// ---------------------------- Google Calendar ----------------------------

    async function getCalEvents() {
        await untis.login()
        const today = new Date()
        today.setMonth(today.getMonth())
        let endtime = new Date(today.getTime())
        endtime.setDate(today.getDate() + config.daysToSync - 1)

        let events = []
        let events_sorted = []

        for (const classKey of classList) {
            let classId = await getClassID(classKey)
            let timetable = await untis.getTimetableForRange(today, endtime,classId.id, 1);
            timetable.forEach(element => {

                baseDate = WebUntis.convertUntisDate(element.date)
                data = {
                    summary: (element.su[0]) ? element.su[0].longname : "unkown",
                    start: {
                        dateTime: WebUntis.convertUntisTime(element.startTime, baseDate)
                    },
                    end: {
                        dateTime: WebUntis.convertUntisTime(element.endTime, baseDate)
                    },
                    location: `${(element.ro[0]) ? element.ro[0].name : "unknown"}`,
                    description: `teacher: ${(element.te[0]) ? element.te[0].name : "unkown"}` +
                        `(${(element.te[0]) ? element.te[0].longname : "unkown"})`
                }
                if (!config.subjectBlacklist.includes(data.summary)) events.push(data)
            })
        }
        events.sort((a, b) => { return a.end.dateTime - b.end.dateTime })
        while (events.length > 0) {
            if (events_sorted.length == 0) events_sorted.push(events.shift())
            else {
                let element = events.shift()
                if ((element.start.dateTime.toString() === events_sorted[events_sorted.length - 1].end.dateTime.toString()) && (element.summary == events_sorted[events_sorted.length - 1].summary)) {
                    events_sorted[events_sorted.length - 1].end.dateTime = element.end.dateTime
                }
                else events_sorted.push(element)
            }
        }
        return events_sorted
    }



async function addEvents(events) {

    let currEvents = (await getEvents()).data.items

    for (let i = 0; i < events.length; i++) {
        for (let j = 0; j < currEvents.length; j++) {
            if (events[i].start.dateTime >= new Date(currEvents[j].start.dateTime) &&
                events[i].start.dateTime <= new Date(currEvents[j].end.dateTime)) {
                try {
                    const res = await calendar.events.delete({
                        auth: auth,
                        calendarId: config.calendarID,
                        eventId: currEvents[j].id
                    })
                    console.log("Event deleted: %s", res.data)
                }
                catch { }
            }
        }
    }


    events.forEach(element => {
        calendar.events.insert({
                auth: auth,
                calendarId: config.calendarID,
                resource: element,
            },
            function (err, event) {
                if (err) {
                    console.log('There was an error contacting the Calendar service: ' + err)
                    return
                }
                console.log('Event created: %s', event.data)
            })
    })
}

async function getEvents() {
    var date = new Date();
    date.setDate(date.getDate() - 1);
    return await calendar.events.list({
        auth: auth,
        calendarId: config.calendarID,
        timeMin: date.toISOString(),
        singleEvents: true,
    })
}})


