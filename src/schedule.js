
import { select } from 'd3-selection';
import { max, min } from 'd3-array';
import { scaleTime } from 'd3-scale';
import { axisBottom } from 'd3-axis';
import { timeFormat, timeFormatDefaultLocale } from 'd3-time-format';
import { 
  utcMinute
} from 'd3-time';

import { html as svg } from '@redsift/d3-rs-svg';
import { time } from '@redsift/d3-rs-intl';
import { text as tspanWrap } from '@redsift/d3-rs-tspan-wrap';
import { 
  random,
  contrasts,
  presentation10,
  display,
  fonts,
  widths,
  dashes
} from '@redsift/d3-rs-theme';

const DEFAULT_SIZE = 420;
const DEFAULT_ASPECT = 160 / 420;
const DEFAULT_MARGIN = 26;  // white space
const DEFAULT_INSET = 24;   // scale space

function _isMinor(d) {
  return (d.getMinutes() !== 0);
}

function coerceMargin(m, def) {
  if (m == null) {
    return def;
  } else if (typeof m === 'object') {
    return { top: m.top, bottom: m.bottom, left: m.left, right: m.right };
  } else {
    return { top: m, bottom: m, left: m, right: m };
  }     
}

export default function schedule(id) {
  
  let classed = 'chart-schedule', 
      theme = 'light',
      background = undefined,
      width = DEFAULT_SIZE,
      height = null,
      margin = DEFAULT_MARGIN,
      style = undefined,
      language = null,
      inset = null,
      scale = 1.0,   
      nice = true, 
      fill = undefined,  
      eventHeight = 38,
      eventPadding = 2,
      textInset = null,
      indexFormat = undefined;

   
  function _impl(context) {
    let selection = context.selection ? context.selection() : context,
        transition = (context.selection !== undefined);    
    
    let localeTime = time(language).d3;
    timeFormatDefaultLocale(localeTime);
    
    let _background = background;
    if (_background === undefined) {
      _background = display[theme].background;
    }
    
    let _height = height || Math.round(width * DEFAULT_ASPECT);

    let _inset = coerceMargin(inset, { top: 0, bottom: DEFAULT_INSET, left: 0, right: 0 });
    let _text = coerceMargin(textInset, { top: 2, bottom: 2, left: 4, right: 4 });
        
    let _fill = fill;
    if (_fill === undefined) {
      let rndLight = random(presentation10.lighter);
      let rndStd = random(presentation10.standard);
      _fill = d => d.status === 'proposed' ? rndStd(d.status) : rndLight(d.status);
    } else if (typeof _fill === 'function') {
       // noop
    } else if (Array.isArray(fill)) {
      _fill = (d, i) => fill[ i % fill.length ];
    } else {
      _fill = () => fill;
    }
    
    let _indexFormat = indexFormat;
    if (_indexFormat === undefined) {
      _indexFormat = timeFormat('%Hh');
    } else if (typeof _indexFormat === 'function') {
      // noop
    } else if (typeof _indexFormat === 'string') {
      _indexFormat = timeFormat(indexFormat);
    }
                  
    selection.each(function(provided) {
        provided = provided || [];
        
        let mn = min(provided, v => v.start) || 0;
        let mx = max(provided, v => v.end) || 10000000;
        let extent = [ mn, mx ];

        // filter out empty events (e.g. range setting values)
        let data = provided.filter((d) => d.status != null);
        
        // create overlap indexes
        data = data.map(function(d, i) {
            let index = 0;
            for (let pos = 0; pos < data.length; pos++) {
                if (pos >= i) break;
                let t = data[pos];
                
                let overlap = (t.start >= d.start && t.start < d.end) || 
                        (t.end > d.start && t.end <= d.end);
                if (overlap) 
                {
                index = t.index + 1;
                }
            }
            d.index = index;
            return d;
        });
        
        let node = select(this);  
        
        // SVG element
        let svgId = null;
        if (id) svgId = 'svg-' + id;
        let svgChart = svg(svgId)
                        .width(width)
                        .height(_height)
                        .margin(margin)
                        .scale(scale)
                        .background(_background);
        
        let w = svgChart.childWidth(),
            h = svgChart.childHeight();
                  
        let _style = style;
        if (_style === undefined) {
          // build a style sheet from the embedded charts
          _style = [ _impl ].reduce((p, c) => p + c.defaultStyle(theme, w), '');
        }
        
        svgChart.style(_style);
      
        if (transition === true) {
          node.transition(context).call(svgChart);
        } else {
          node.call(svgChart);
        }
        
        let svgNode = node.select(svgChart.self()).select(svgChart.child());

        // Create required elements
        let g = svgNode.select(_impl.self())
        if (g.empty()) {
          g = svgNode.append('g').attr('class', classed).attr('id', id);

          g.append('g').attr('class', 'axis');
          g.append('g').attr('class', 'events');
        }

        let x = scaleTime()
            .domain(extent)
            .rangeRound([_inset.left, w - _inset.right]);
        
        if (nice === true) {    
            x = x.nice();
        }

        let xAxis = axisBottom()
            .scale(x)
            .tickFormat(_indexFormat)
            .ticks(utcMinute, 30)
            .tickPadding(4)
            .tickSize(-h, 0);

                    
        let grid = g.select('g.axis');
        
        if (transition === true) {
          grid = grid.transition(context);
        }
        
        grid.attr('transform', 'translate(0, ' + h + ')')
            .call(xAxis);
       
        grid
            .selectAll('text')
            .attr('fill', d => _isMinor(d) ? 'none' : display[theme].text);

        grid
            .selectAll('path.domain')
            .attr('stroke', display[theme].axis)
            .attr('stroke-width', widths.axis); 
            
        grid
            .selectAll('line')
            .attr('stroke', d => _isMinor(d) ? display[theme].grid : display[theme].axis)
            .attr('stroke-width', d => _isMinor(d) ? widths.grid : widths.axis); 
         
        // Event rects
        let events = g.select('g.events');

        let event = events.selectAll('g.event').data(data);
        
        event.exit().remove();
        
        let newEvent = event.enter()
            .append('g')
              .attr('class', 'event');
        
        newEvent.append('rect');
        newEvent.append('text');
                      
        event = newEvent.merge(event);

        if (transition === true) {
          event = event.transition(context);
        }
            
        event.attr('transform', d => `translate(${x(d.start)},${d.index * (eventHeight + eventPadding)})`);

        event.select('rect')
            .attr('fill', _fill)
            .attr('width', d => x(d.end) - x(d.start))
            .attr('height', eventHeight);


        let wrap = tspanWrap().text(d => d.summary);

        event.select('text')
            .attr('dominant-baseline', 'text-before-edge')
            .attr('fill', (d, i) => contrasts.white(_fill(d, i)) ? display.dark.text : display.light.text)
            .attr('x', _text.left)
            .attr('y', _text.top)
            .attr('width', (d) => x(d.end) - x(d.start) - _text.left - _text.right)
            .attr('height', eventHeight - _text.top - _text.bottom)
            .call(wrap);
                                  
    });
  }

  _impl.self = function() { return 'g' + (id ?  '#' + id : '.' + classed); }

  _impl.id = function() {
    return id;
  };

  _impl.defaultStyle = (_theme, _width) => `
                  ${fonts.fixed.cssImport}  
                  ${fonts.variable.cssImport}  
                  ${_impl.self()} line,
                  ${_impl.self()} path { 
                                        shape-rendering: crispEdges; 
                                      }
                  ${_impl.self()} .events text { 
                                        font-family: ${fonts.variable.family};
                                        font-size: ${fonts.variable.sizeForWidth(_width)};   
                                        font-weight: ${fonts.variable.weightMonochrome};               
                                      }                                              
                  ${_impl.self()} .axis text { 
                                        font-family: ${fonts.fixed.family};
                                        font-size: ${fonts.fixed.sizeForWidth(_width)};   
                                        font-weight: ${fonts.fixed.weightMonochrome};               
                                      }
                `;
    
  _impl.classed = function(value) {
    return arguments.length ? (classed = value, _impl) : classed;
  };
    
  _impl.background = function(value) {
    return arguments.length ? (background = value, _impl) : background;
  };

  _impl.theme = function(value) {
    return arguments.length ? (theme = value, _impl) : theme;
  };  

  _impl.size = function(value) {
    return arguments.length ? (width = value, height = null, _impl) : width;
  };
    
  _impl.width = function(value) {
    return arguments.length ? (width = value, _impl) : width;
  };  

  _impl.height = function(value) {
    return arguments.length ? (height = value, _impl) : height;
  }; 

  _impl.scale = function(value) {
    return arguments.length ? (scale = value, _impl) : scale;
  }; 

  _impl.margin = function(value) {
    return arguments.length ? (margin = value, _impl) : margin;
  };   
  
  _impl.style = function(value) {
    return arguments.length ? (style = value, _impl) : style;
  }; 

  _impl.eventHeight = function(value) {
    return arguments.length ? (eventHeight = value, _impl) : eventHeight;
  }; 
  
  _impl.eventPadding = function(value) {
    return arguments.length ? (eventPadding = value, _impl) : eventPadding;
  };   
  
  _impl.textPadding = function(value) {
    if (!arguments.length) return {
        top: textTop,
        right: textRight,
        bottom: textBottom,
        left: textLeft
    };
    if (value.top !== undefined) {
      textTop = value.top;
      textRight = value.right;
      textBottom = value.bottom;
      textLeft = value.left; 
    } else {
      if (typeof value === 'string') value = parseInt(value);
      textTop = value;
      textRight = value;
      textBottom = value;
      textLeft = value;
    } 
    return _impl;
  };

  _impl.language = function(value) {
    return arguments.length ? (language = value, _impl) : language;
  };    
  
  _impl.inset = function(value) {
    return arguments.length ? (inset = value, _impl) : inset;
  };    
  
  _impl.nice = function(value) {
    return arguments.length ? (nice = value, _impl) : nice;
  };   

  _impl.fill = function(value) {
    return arguments.length ? (fill = value, _impl) : fill;
  }; 
      
  _impl.textInset = function(value) {
    return arguments.length ? (textInset = value, _impl) : textInset;
  };       

  _impl.indexFormat = function(value) {
    return arguments.length ? (indexFormat = value, _impl) : indexFormat;
  };       
      
      
  return _impl;
}