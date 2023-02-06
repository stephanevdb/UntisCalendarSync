# UntisCalendarSync
Sync Untis to google calendar                                                   
                                                                                
## Prerequisites                                                                
* Docker 
* Google account with Google Calendar
* config folder on host


## Setup
1. [Create a Google Cloud Project](https://developers.google.com/workspace/guides/create-project).
2. Enable the Calendar API ([Enable-APIs](https://developers.google.com/workspace/guides/enable-apis)).
3. [Create a service account and credentials](https://developers.google.com/workspace/guides/create-credentials#service-account) 
and save them as google-credentials.json in application directory.
4. [Create a new calendar](https://support.google.com/calendar/answer/37095?hl=en) and save the calendar id in the config.json file and add this to the config folder on the host.
5. In the calendar settings go to "Share with specific people", click "Add people" and paste the client email from the downloaded JSON
service key file.




## config.json
Configuration in config.json in config folder on the host. <br>
Schedule in cron format (default every day at 3AM)
```
{
  "Qr": "untis://setschool?url=[...]&school=[...]&user=[...]&key=[...]&schoolNumber=[...]>",
  "ClassList": ["1IT6","2ITCSC1","1ITCSC2"],
  "daysToSync": 14 ,
  "schedule": "0 3 * * *",
  "calendarID": "*********@group.calendar.google.com",
  "subjectBlacklist": ["Enterprise networking","Network Security","AI Principles","Project analysis","Ideation","AI principles",
    "Neural networks","Security project"]
}
```

## docker-compose.yml
Set "/path/on/host" to your config folder
```
version: '3'
services:
  untis-to-googlecalendar:
    image: stephanevdb/untis-to-googlecalendar:latest
    container_name: untis-to-googlecalendar
    environment:
      - TZ=Europe/Brussels
    volumes:
      - /path/on/host:/usr/src/app/config
    restart: unless-stopped
```
