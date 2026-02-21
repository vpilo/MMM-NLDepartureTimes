# OVApi configuration

To use the OVApi data source, the configuration in your `config/config.js` file needs to contain the `tpc` entry:

```javascript
  modules: [
  {
    module: "MMM-NLDepartureTimes",
    /* ... */
    config: {
      /* ... */
      source: "ovapi",
      tpc: {
        'Leidschenveen': {
          minutesToReach: 8,
          'Den Haag': [31008721, 32009597],
          'Zoetermeer': [32009596],
          'Rotterdam': [31008722],
        },
        'De Lanen': {
          'Leidschendam': [32009591],
        },
      }
    }
},
]
```

The `tpc` parameter in the settings is a Javascript Object.

#### Object design:

| Level | Description | Explanation
|-------|-------|------
|Top  | Name of the group of stops | Name of choice of your hub.<br />**Type:** String.
|2nd  | Name of the destination | Array that contains the actual TPC (stopcodes)<br />**Type:** Integer
|2nd, `minutesToReach` parameter | Minutes to reach this stop | Optional number of minutes necessary to reach this public transport stop. If a departure is too close in time to be able to get to the stop, it will be dimmed and show 🏃.<br />**Type:** Integer.

TPC is a code that identifies a stop. To get the right TPC, it will require some research. Until now I haven't found one document that contains all the data needed. If you know a quicker solution, please let me know!

#### Find the TPC code

**tl;dr**

The TPC is in the xml file called PassengerStopAssignmentCHB{timestamp}.xml from [NDOV Loket's haltes folder](http://data.ndovloket.nl/haltes/).
Convert the 'stopname' to a 'userstopcode' using either [OV Zoeker](https://ovzoeker.nl/) or [KV1](http://data.ndovloket.nl/). Convert the 'userstopcode' to a TPC via the XMLs from [halte export](http://data.ndovloket.nl/haltes).

**Detailed steps**

First you need to find a location where you want to get the departure times from. In this example I picked two stops. The stops of RandstadRail 3 & 4 to The Hague and to Zoetermeer together with metro line E to The Hague and Rotterdam. I will call this stop Leidschenveen. In real it has 3 different names. From a tram stop further away line 19 to Leidschendam is needed. The direction to Delft is not needed. This stop will be called De Lanen.

You can find your own stops at [OV Zoeker](https://ovzoeker.nl/) and also the operator.

To sum up the data needed.

| Stopname | Line | Operator | Destination | Real Destination
|---------------|---|-----|-----------|-------
| Leidschenveen | 3 | HTM | Den Haag | Den Haag Loosduinen
| Leidschenveen | 4 | HTM | Den Haag | Den Haag Uithof
| Leidschenveen | 3 | HTM | Zoetermeer | Zoetermer Centrum West
| Leidschenveen | 4 | HTM | Zoetermeer | Lansingerland Zoetermeer
| Leidschenveen | E | RET | Den Haag | Den Haag Centraal
| Leidschenveen | E | RET | Rotterdam | Slinge
| De Lanen | 19 | HTM | Leidschendam | Leidschendam

Now the stopnames can be converted to userstopcodes. From [OV Zoeker](https://ovzoeker.nl/) you can find them by clicking on a stop and select the code behind 'Haltenummer'.

![stop code](stops.png)

A more complex way is via a [KV1](http://data.ndovloket.nl/). The KV1 archive is in the folder of the operator at [data.ndovloket.nl](http://data.ndovloket.nl/). In this KV1 archive you need the file USERSTOPXXX.TMI. This is plain text holding all data about a stop. For line 3 and 4 the userstopcode is `9597`.

Open the XML file and search for the userstopcode. In this example the following node gives a hit for userstopcode 9597.

`USRSTOP|1|I|HTM|9597||TRUE|TRUE|N|Leidschenveen|Den Haag|9596|-|||0||exitDirection=No side;EnableTailTrack=F;SizeOfBay=43;BayBeforePole=38;garage=F|PASSENGER`

Next step is to get the TPC. From [halte export](http://data.ndovloket.nl/haltes) we can retrieve the PassengerStopAssignmentCHB{timestamp}.xml file and ExportCHB for the trains of NS. Open the XML file and search for the userstopcode. In this example the following node gives a hit for userstopcode 9597.
```XML
  <quay>
    <quaycode>NL:Q:32009597</quaycode>
    <userstopcodes>
      <userstopcodedata>
        <dataownercode>HTM</dataownercode>
        <userstopcode>9597</userstopcode>
        <validfrom>2014-12-14 00:00:00</validfrom>
      </userstopcodedata>
    </userstopcodes>
  </quay>
```
The ```XML <quaycode>``` contains the TPC code. In this case 32009597.

By going to [https://v0.ovapi.nl/tpc/32009597](http://v0.ovapi.nl/tpc/32009597) you can test if the TPC is correct. When an XML file is generated with stop data and time information, we have the right TPC code.

The final table will be:

| Stopname | Line | Operator | Destination | stopcode | TPC
|---------------|---|-----|-----------|-------|----
| Leidschenveen | 3 | HTM | Den Haag   | 9597 | 32009597
| Leidschenveen | 4 | HTM | Den Haag   | 9597 | 32009597
| Leidschenveen | 3 | HTM | Zoetermeer | 9596 | 32009596
| Leidschenveen | 4 | HTM | Zoetermeer | 9596 | 32009596
| Leidschenveen | E | RET | Den Haag   | HA8721 | 31008722
| Leidschenveen | E | RET | Rotterdam  | HA8722 | 31008721
| De Lanen | 19 | HTM | Leidschendam   | 9591 | 32009591

This compresses to

| Stopname | Destination | TPC
|--|--|--
| Leidschenveen | Den Haag | 3200597, 31008722
| Leidschenveen | Zoetermeer| 3200596
| Leidschenveen | Rotterdam | 31008721
| De Lanen | Leidschendam | 32008581

## Licenses

Data from [OVApi](http://www.ovapi.nl) comes from [NDOV Loket](https://ndovloket.nl). The usage is limited to 1 production system and 1 user. So does the use of this module.
Because data is not from my sources, nor from OVApi, I and OVApi are not responsible for data loss, damage or (in)consistency of data.
For more details, please see their websites.

## Privacy Statement

On [OVApi](http://www.ovapi.nl/privacy.html) there is a privacy statement in Dutch. If you require a non-Dutch version, please contact them directly.
I have no responsibility for what happens to your data. Nor do I store any data from you.
