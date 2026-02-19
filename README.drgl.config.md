# DRGL configuration

To use the [DRGL.nl](http://drgl.nl) data source, the configuration in your `config/config.js` file needs to contain the `drgl` entry:

```javascript
  modules: [
  {
    module: "MMM-NLDepartureTimes",
    /* ... */
    config: {
      /* ... */
      source: "drgl",
      drgl: {
					'Leidschenveen': {
						'Den Haag': {
							stop: "NL:S:31008721",
              lines: [ "Den Haag Centraal", "DH De Uithof" ],
						},
					},
          'Zoetermeer': {
						'All vehicles': {
              stop: "NL:S:42063501",
              lines: [], /* This shows all directions going from here. */
            }
          },
      }
    }
},
]
```

The `drgl` parameter in the settings is a Javascript Object.

## Parameter design

| Level | Description | Explanation
|-------|-------|------
|Top  | Name of the group of stops | Name of choice of your hub.<br />**Type:** String.
|2nd  | Name of the destination | Name of choice of the destination.<br />**Type:** JS Object.
|3rd  | Destination configuration | **Type:** JS Object.
|4th, `stop` parameter | The stop ID string | See below on how to obtain it.<br />**Type:** String.
|4th, `lines` parameter | Line filter | Optional bus line *name* filter. Used only if not omitted and not empty: otherwise, all lines departing from this stop will be shown, in any direction.<br />Note that the elements are line *names*, not codes.<br />**Type:** Array of String.

### Obtaining a stop ID

To obtain a stop ID, go to [DRGL.nl](http://drgl.nl) and search for your stop's name. If you are not sure, you can use [OV Zoeker](https://ovzoeker.nl/) to search for it on the map, and search for its name on DRGL. Click on the stop, and you will be redirected to a page whose URL will look like `https://drgl.nl/stop/NL:S:31008721`. The `NL:..` part is your stop ID:

```javascript
'Den Haag': {
  stop: "NL:S:31008721",
},
```

This will show all lines departing from that stop in all directions, which is often too much information; they can be narrowed down.

### Filtering

From the stop's page on DRGL, you can see that all lines passing by this place are shown - on any direction.
Copy paste the exact name of each one of the public transport lines you do care about into the `lines` array:

```javascript
'Den Haag': {
  stop: "NL:S:31008721",
  lines: [ "Den Haag Centraal", "DH De Uithof" ],
},
```
