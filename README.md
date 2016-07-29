# d3-rs-schedule

`d3-rs-schedule` generate a schedule / calander like presentation.

## Builds

[![Circle CI](https://circleci.com/gh/Redsift/d3-rs-schedule.svg?style=svg)](https://circleci.com/gh/Redsift/d3-rs-schedule)

## Example

[View @redsift/d3-rs-schedule on Codepen](http:...)

### Line chart

![Sample bars with a bottom orientation](https://bricks.redsift.io/reusable/d3-rs-pies.svg?_datum=[1,200,3100,1000]&orientation=bottom)

### Area chart

![Sample bars with a left orientation](https://bricks.redsift.io/reusable/d3-rs-pies.svg?_datum=[1,200,3100,1000]&orientation=left&fill=global)

### Combination

![Sample bars with a top orientation and time label](https://bricks.redsift.io/reusable/d3-rs-pies.svg?_datum=[{%22v%22:1,%22l%22:1466424812000},{%22v%22:2,%22l%22:1466511212000},{%22v%22:3,%22l%22:1466597612000},{%22v%22:300.5,%22l%22:1466684012000},{%22v%22:4000,%22l%22:1466770412000},{%22v%22:40000,%22l%22:1466856812000}]&orientation=top&labelTime=%25a%20%25d)

## Usage

### Browser
	
	<script src="//static.redsift.io/reusable/d3-rs-schedule/latest/d3-rs-schedule.umd-es2015.min.js"></script>
	<script>
		var chart = d3_rs_lines.html();
		d3.select('body').datum([ 1, 2, 3, 10, 100 ]).call(chart);
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



### Parameters

Property|Description|Transition|Preview
----|-----------|----------|-------
`classed`|*String* SVG custom class|N
`width`, `height`, `size`, `scale`|*Integer* SVG container sizes|Y
`style`|*String* Custom CSS to inject into chart|N

