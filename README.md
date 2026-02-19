# MMM-NLDepartureTimes

## Introduction

This module shows the departure times of Dutch public transport grouped by stops and destination of choice.

 In this example you see the stops De Lanen and Leidschenveen. Leidschenveen is a LightRail hub that serves lines 3, 4, E, 19, 30, and N5. The lines of interest are grouped by their destination, instead of by line number. This way you can quickly see when a vehicle departs to your real destination to travel.

![preview](./screenshot.png)

In the screenshot above I have two stops; Leidschenveen and De Lanen for streetcar 19. The destination is here set to what I think is relevant for me. For instance, line 3 goes to Den Haag Loosduinen and E goes to Den Haag Centraal. In this example it is relevant for me that they go to Den Haag. So, I grouped them in destination Den Haag. Line 19 is grouped in destination Leidschendam. In this example I am only interested in direction Leidschendam and the other destination Delft is left out this way.

The data used by this module comes by default from [OVapi](https://www.ovapi.nl). OVApi is a semi-private project that allows usage by the public.

An alternative source, [DRGL](https://www.drgl.nl), may be used for two reasons:

 * it is quite complex to find out which data to obtain from OVApi;
 * in some cases, the OVApi data is not reliable enough, as stops may be missing or wrong.

 This MagicMirror module was originally made by [TravelBacon](https://github.com/Travelbacon/MMM-NLDepartureTimes), and I've forked it for a few reasons. First, it did not show delays. Second, a few stops I'm interested in are not correctly represented in OVApi. Third, finding TPC codes is always very complex - and every time local companies change schedules, you need to search again (thanks for nothing, QBuzz). So I added DRGL support instead.

## Installation

Clone the repository in the modules directory of MagicMirror:

    cd modules
    git clone https://github.com/Travelbacon/MMM-NLDepartureTimes

Then install this module's dependencies:

  cd MMM-NLDepartureTimes
  npm install

## Updates

To update the module:

  cd MMM-NLDepartureTimes
  git pull
  npm install

### Note about updating from `TravelBacon/MMM-NLDepartureTimes`:

You can switch over with these commands:

```bash
git remote set-url origin https://github.com/vpilo/MMM-NLDepartureTimes.git
git pull
git switch main
git branch -D master
```

Then you can update the configuration by changing the `maxVehics` parameter into `maxVehicles`.

## Configuration

To use this module, add the following configuration to your `config/config.js` file.

```javascript
  modules: [
  {
    module: "MMM-NLDepartureTimes",
    position: "top_left",
    header: "Departure Times",
    config: {
      maxVehicles: 5,
      updateSpeed: 10,
      tpc: { .. }, // See below to understand how to set this up.
      drgl: { .. }, // See below to understand how to set this up.
    }
}]
```

These are the generic options:

| Option | Description
|----------|-------------
|`module`   | Module Name. (See [MM Documentation](https://docs.magicmirror.builders/modules/configuration.html))
|`position` | Position of the module. (See [MM Documentation](https://docs.magicmirror.builders/modules/configuration.html))
|`header`   | Title displayed. (See [MM Documentation](https://docs.magicmirror.builders/modules/configuration.html))
|`maxVehicles` | Number of departure times displayed per destination.<br />**Type:** Integer, **Default:** 4
|`h24` | Whether to display departure times with 24-hours format (`true`), or 12-hours format with AM-PM (`false`). <br />**Type:** Boolean, **Default:** true
|`updateSpeed` | refresh time in minutes. Please keep a slow refresh due to the non-commercial nature of the API server. See [Github](https://github.com/skywave/KV78Turbo-OVAPI/wiki) of OVapi for etiquette.<br />**Type:** Integer, **Default:** 10
|`source` | Data source name. Supported source: `"ovapi"` and `"drgl"`. See below for more information. <br />**Default:** `"ovapi"`
|`tpc` | Data source configuration when `source` is `"ovapi"`. See below for more information.
|`drgl` | Data source configuration when `source` is `"drgl"`. See below for more information.

## Configure the data source

If you choose the default `"ovapi"` data source, check the [OVApi configuration README](./README.ovapi.config.md).

If you choose the alternative `"drgl"` data source, check the [DRGL configuration README](./README.drgl.config.md).

