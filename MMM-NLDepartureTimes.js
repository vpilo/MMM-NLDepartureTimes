
Module.register("MMM-NLDepartureTimes", {

  statusDom: undefined,
  timeTableList: Object,
  error: undefined,

  defaults: {
    updateSpeed: 10,
    maxVehicles: 5,
    source: "ovapi",
  },

  getScripts: function () {
    return ['moment.js'];
  },

  start: function () {
    Log.info(`Starting module ${this.name}`);
    this.statusDom = 'Loading';
    this.resume();
  },

  resume: function () {
    var self = this;
    setInterval(function () {
      self.getTable();
    },
      this.config.updateSpeed * 60_000);
  },

  getTable: function () {
    this.sendSocketNotification("REQUEST_TIMETABLE", this.config);
  },

  getStyles: function () {
    return ["MMM-NLDepartureTimes.css"];
  },

  getDom: function () {
    let wrapper = document.createElement("div");

    switch (this.statusDom) {
      case 'Loading':
        this.sendSocketNotification("REQUEST_TIMETABLE", this.config);
        wrapper.innerHTML = "Loading...";
        return wrapper;

      case 'error':
        Log.error(this.error);
        wrapper.innerHTML = this.error;
        return wrapper;

      case 'newTable':
        const table = document.createElement("table");
        table.id = "timeTable";
        const timeFormat = this.config.timeFormat === 24 ? "HH:mm" : "hh:mm A";
        for (const stopArea in this.timeTableList) {
          //Fetch the Stoparea.
          let row = document.createElement("tr");
          let lineHeader = document.createElement("th");
          lineHeader.innerHTML = stopArea;
          lineHeader.className = "bold";
          lineHeader.colSpan = 3;
          row.appendChild(lineHeader);
          table.appendChild(row);
          //Fetch direction
          for (const direction in this.timeTableList[stopArea]) {
            let row = document.createElement("tr");
            let lineDirection = document.createElement("td");
            lineDirection.innerHTML = direction;
            lineDirection.colSpan = 3;
            lineDirection.className = "small";
            row.appendChild(lineDirection);
            table.appendChild(row);

            //fetch vehicles
            let vehicleCount = 0;
            for (const vehicle of this.timeTableList[stopArea][direction]) {
              vehicleCount++;

              //Create time + delay
              let row = document.createElement("tr");
              let vehicleTime = document.createElement("td");
              vehicleTime.innerHTML = moment(vehicle.DepTime).format(timeFormat);
              vehicleTime.className = "xsmall light vehicDepTime";
              const delayMin = Number(vehicle.Delay);
              if (isFinite(delayMin) && delayMin !== 0) {
                const delaySpan = document.createElement("span");
                delaySpan.className = delayMin > 0 ? "timeDelay" : "timeEarlier";
                delaySpan.innerHTML = ` ${delayMin > 0 ? "+" : ""}${delayMin}m`;
                vehicleTime.appendChild(delaySpan);
              }
              row.appendChild(vehicleTime);

              //Create line number + destination
              let vehicleLine = document.createElement("td");
              vehicleLine.innerHTML = vehicle.LineName;
              vehicleLine.className = "xsmall light vehicLine";
              row.appendChild(vehicleLine);

              let vehicleDestination = document.createElement("td");
              vehicleDestination.innerHTML = vehicle.Destination;
              vehicleDestination.className = "xsmall light vehicleDestination";
              row.appendChild(vehicleDestination);

              table.appendChild(row);

              if (vehicle.Remarks && vehicle.Remarks.length > 0) {
                let remarksRow = document.createElement("tr");
                let remarkTd = document.createElement("td");
                remarkTd.colSpan = 3;
                remarkTd.innerHTML = `(${vehicle.Remarks})`;
                remarkTd.className = "xxsmall light remarks";
                remarksRow.appendChild(remarkTd);
                table.appendChild(remarksRow);
              }

              if (vehicleCount === this.config.maxVehicles) {
                break;
              }
            }
          }
        }

        wrapper.appendChild(table);
        this.statusDom = 'Request'; //Not used in script. Nice for debugging.
        return wrapper;
    }
  },

  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case 'RESPONSE_TIMETABLE':
        this.statusDom = 'newTable';
        this.timeTableList = payload;
        this.updateDom(2000);
        break;

      case 'RESPONSE_ERROR':
        this.statusDom = 'error';
        Log.error(payload);
        this.error = payload;
        this.updateDom(2000);
        break;

      default:
        Log.error(`Unknown notification received: ${notification}`);
        break;
    }
  },

});
