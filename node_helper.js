// From configuration in the magic mirror.

const axios = require('axios');
const cheerio = require('cheerio');
const Log = require('logger');

const DEBUG = false;

var NodeHelper = require('node_helper');
module.exports = NodeHelper.create({

  timeTable: new Object(),

  socketNotificationReceived: function (notification, payload) {
    if (notification !== 'REQUEST_TIMETABLE') return;

    if (!payload || !payload.source) {
      this.sendSocketNotification('RESPONSE_ERROR', `No 'source' specified in config. See README.md for details.`);
      return;
    }

    switch (payload.source.toUpperCase()) {
      case 'OVAPI':
        if (!payload.tpc) {
          this.sendSocketNotification('RESPONSE_ERROR', `No 'tpc' section in config. See README.md for details.`);
          return;
        }
        this.requestOvApiData(payload.tpc);
        break;

      case 'DRGL':
        if (!payload.drgl) {
          this.sendSocketNotification('RESPONSE_ERROR', `No 'drgl' section in config. See README.md for details.`);
          return;
        }
        this.requestDeRegelingPage(payload.drgl);
        break;

      default:
        this.sendSocketNotification('RESPONSE_ERROR', `Unknown source '${payload.source}' in config. See README.md for details.`);
        return;
    }
  },

  parseOvApiData: function (jsonData, stopCodeConfig, timeTable) {
    /* 
      The JSON comes with level 1 with the time table for a stop code.
      This code wants to group the times not on a stop level, but on a direction level.
      A direction A can have multilple stops.
      Best way is to look in the JSON per stop, and find the proper direction.
    */
    // JSON has on level 1 the stop codes.
    // The time tables from different stops must be sorted to a direction.
    // Get the stop code from the config and check if present in JSON.
    // If present parse the node in the timetable.
    for (let confHaltGroup in stopCodeConfig) { // Find the halt group / area in the group
      // Each direction has multiple physical halts with its own stop code
      for (let confDirection in stopCodeConfig[confHaltGroup]) {
        for (let confStopCode of stopCodeConfig[confHaltGroup][confDirection]) {
          if (confStopCode in jsonData) {
            // Make an object of the vehicle to add in timeTable
            for (let vehicInfo in jsonData[confStopCode]['Passes']) {
              let vehicRaw = jsonData[confStopCode]['Passes'][vehicInfo];
              const expected = new Date(vehicRaw.ExpectedDepartureTime);
              const target = new Date(vehicRaw.TargetDepartureTime).getTime();
              let validDelay = Number.isFinite(expected.getTime()) && Number.isFinite(target);
              let vehicle = {
                LineName: vehicRaw.LinePublicNumber,
                DepTime: expected,
                Delay: validDelay ? Math.round((expected.getTime() - target) / 60000) : 0,
                Destination: vehicRaw.DestinationName50,
                Remarks: [],
              };
              // Add the object in the list sorted on time.
              let i = 0;
              for (; i < timeTable[confHaltGroup][confDirection].length; i++) {
                if (vehicle['DepTime'] <= timeTable[confHaltGroup][confDirection][i]['DepTime']) {
                  break;
                }
              }
              timeTable[confHaltGroup][confDirection].splice(i, 0, vehicle);
            }
          }
        }
      }
    }
  },

  parseDeRegelingPage: function (html, stopData, timeTable) {
    if (DEBUG) Log.verbose(`DeRegeling response for ${JSON.stringify(stopData)}: ${html}`);

    const $ = cheerio.load(html);

    $('.list-group-item').each(function () {
      var $this = $(this);

      if ($this.find('.ott-departed').length > 0) {
        return;
      }

      const linenumber = $this.find('.ott-linecode').html();
      const destination = $this.find('.ott-destination').html();

      const timeinfoStr = $this.find('.ott-departure-time').html();
      if (typeof timeinfoStr !== 'string') {
        if (DEBUG) Log.debug(`No time found in list item: ${$this.html()}`);
        return;
      }
      const timeinfo = timeinfoStr.split(' ');
      const delay = timeinfo.length == 2 ? parseInt(timeinfo[1]) : 0;

      let time = new Date();
      if (/^\d{1,2}:\d{2}$/.test(timeinfo[0])) {
        const [hh, mm] = timeinfo[0].split(':').map(Number);
        time.setHours(hh, mm, 0, 0);
        const now = new Date();
        if (time.getTime() < now.getTime()) {
          time.setDate(time.getDate() + 1);
        }
      } else {
        if (DEBUG) Log.debug(`Invalid time found in list item: ${$this.html()}`);
        return;
      }

      if (DEBUG) Log.debug(`Extracted line: ${linenumber}, time: ${time}, delay: ${delay}`);

      // DRGL shows all lines departing from a stop, in all directions. Filtering is necessary.
      if (stopData.lines && !stopData.lines.includes(destination)) {
        if (DEBUG) Log.verbose(`skipping line ${linenumber} to ${destination} as not in config lines: ${stopData.lines}`);
        return;
      }

      let vehicle = {
        LineName: linenumber,
        DepTime: time,
        Delay: delay,
        Destination: destination,
        Remarks: []
      };

      $this.find('.notice').each(function () {
        vehicle.Remarks.push($(this).html())
      });
      vehicle.Remarks = vehicle.Remarks.join('&nbsp;');

      if (DEBUG) Log.verbose(`vehicle: ${JSON.stringify(vehicle)}`);

      timeTable.push(vehicle);
    });

    if (DEBUG) Log.info(`timetable for ${stopData.stop}: ${JSON.stringify(timeTable)}`);
  },

  requestOvApiData: function (stopCodeConfig) {
    let URLtpc = '';
    this.timeTable = {};
    for (let haltGroup in stopCodeConfig) {
      this.timeTable[haltGroup] = {};
      for (let stopCode in stopCodeConfig[haltGroup]) {
        this.timeTable[haltGroup][stopCode] = [];
        URLtpc += stopCodeConfig[haltGroup][stopCode] + ',';
      }
    }

    URLtpc = URLtpc.replace(/,+$/, '');
    let requestUrl = `http://v0.ovapi.nl/tpc/${URLtpc}/departures/`;
    axios.get(requestUrl)
      .then((response) => {
        this.parseOvApiData(response.data, stopCodeConfig, this.timeTable);
        this.sendSocketNotification('RESPONSE_TIMETABLE', this.timeTable);
      })
      .catch((error) => {
        this.sendSocketNotification('RESPONSE_ERROR', error.message);
      });
  },

  requestDeRegelingPage: function (stopCodeConfig) {
    this.timeTable = {};
    const requests = [];

    for (let origin in stopCodeConfig) {
      this.timeTable[origin] = {};
      for (let destination in stopCodeConfig[origin]) {
        let stopData = stopCodeConfig[origin][destination];
        let stop = stopData.stop;
        let requestUrl = `https://drgl.nl/stop/${stop}/departurespanel`;
        if (DEBUG) Log.debug(`getting: ${requestUrl}`);

        const request = axios.get(requestUrl)
          .then((response) => {
            let stopTimeTable = new Array();
            this.parseDeRegelingPage(response.data, stopData, stopTimeTable);
            this.timeTable[origin][destination] = stopTimeTable;
          })
          .catch((error) => {
            Log.error(`Error parsing ${requestUrl}: ${error}`);
          });
        requests.push(request);
      }
    }

    Promise.allSettled(requests).then(() => {
      const sortedTimeTable = Object.keys(this.timeTable)
        .sort()
        .reduce((acc, origin) => {
          acc[origin] = this.timeTable[origin];
          return acc;
        }, {});
      this.sendSocketNotification('RESPONSE_TIMETABLE', sortedTimeTable);
    });
  },
});
