# d3-rs-schedule

[![Circle CI](https://img.shields.io/circleci/project/redsift/d3-rs-schedule.svg?style=flat-square)](https://circleci.com/gh/redsift/d3-rs-schedule)
[![npm](https://img.shields.io/npm/v/@redsift/d3-rs-schedule.svg?style=flat-square)](https://www.npmjs.com/package/@redsift/d3-rs-schedule)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://raw.githubusercontent.com/redsift/d3-rs-schedule/master/LICENSE)

`d3-rs-schedule` generate a schedule / calander like presentation via the D3 reusable chart convention.

## Example

[View @redsift/d3-rs-schedule on Codepen](http://codepen.io/rahulpowar/pen/rWmgde)

### Empty

![Empty](https://bricks.redsift.cloud/reusable/d3-rs-schedule.svg])


### Single Entry

![Single Entry](https://bricks.redsift.cloud/reusable/d3-rs-schedule.svg?_datum=[{%22s%22:1469723575941,%22e%22:1469726870991,%22t%22:%22Initial%20Event%22},{%22s%22:1469723575941,%22e%22:1469729870991,%22t%22:%22Event%20Two%22,%22u%22:%22proposed%22}]&prefixDurationFormat=%25H:%25M)

## Usage

### Browser
	
	<script src="//static.redsift.io/reusable/d3-rs-schedule/latest/d3-rs-schedule.umd-es2015.min.js"></script>
	<script>
		var chart = d3_rs_schedule.html();
		d3.select('body').datum([ { s: 1469723575941, e: 1469726870991, t: "Text to display", u: "proposed" } ]).call(chart);
	</script>

### ES6

	import { chart } from "@redsift/d3-rs-schedule";
	let eml = chart.html();
	...
	
### Require

	var chart = require("@redsift/d3-rs-schedule");
	var eml = chart.html();
	...

### Datum

[{ s: 1469723575941, e: 1469726870991, t: "Text to display", u: "proposed" } ...]

`s` start timestamp for the event (epoch UTC ms)
`e` start timestamp for the event (epoch UTC ms)
`t` text to display
`u` status text for the event. This is used by the default fill function to highlight events. The known values are `proposed`, `conflict` and `provisional`.

### Parameters

Property|Description|Transition|Preview
----|-----------|----------|-------
`classed`|*String* SVG custom class|N
`width`, `height`, `size`, `scale`|*Integer* SVG container sizes|Y
`style`|*String* Custom CSS to inject into chart|N
`indexFormat`|*String, Function* Change the time presentation on the axis. If string, utilises [d3-time-format](https://github.com/d3/d3-time-format#locale_format). If a function, must be a comptabile formatter. Default `%Hh`
`language`|*String* Change the language, affects time formats. Typically auto detected from the browser.
`timezone`|*String* Set the timezone for display e.g. `Asia/Colombo`
`prefixDurationFormat`|*String* Prefix the event text with start and end time
`tickInterval`|*Array* Interval of the ticks, typically an [interval and a specifier](https://github.com/d3/d3-axis#axis_ticks) e.g. `d3.timeMinute.every(15)`
`eventWidth`|*Integer* Width to use for the event rects

### Know isues

Timezones that differ from UTC with 30 or 45 min offsets do not present the correct boundaries.