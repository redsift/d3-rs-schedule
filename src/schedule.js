
import { select } from 'd3-selection';
import { max, min } from 'd3-array';
import { scaleTime } from 'd3-scale';
import { axisLeft } from 'd3-axis';
import { timeFormat, timeFormatDefaultLocale } from 'd3-time-format';
import { 
  utcMinute,
  utcHour
} from 'd3-time';

import { html as svg } from '@redsift/d3-rs-svg';
import { time } from '@redsift/d3-rs-intl';
import { text as tspanWrap } from '@redsift/d3-rs-tspan-wrap';
import { 
  display,
  fonts,
  widths,
  diagonals,
  patterns,
  contrasts
} from '@redsift/d3-rs-theme';

const DEFAULT_SIZE = 420;
const DEFAULT_ASPECT = 1150 / 1000;
const DEFAULT_MARGIN = 26;  // white space
const DEFAULT_INSET = 24;   // scale space
const DEFAULT_TICKS_HOURS = 7; // show up to 7 hours on the axis
const STROKE_PX = 3;

const PAL_PAJAMA2 = [
  '#D3F9E9E2',
  '#AFEBF0E2'
];

const PAL_TEXT = '#5C5C5C';
const PAL_STRIPE = '#eee';  

const DEFAULT_TEXT_INSET = 7;
const DEFAULT_EVENT_PADDING = -17;

const SYM_START = 's',
      SYM_END = 'e',
      SYM_TEXT = 't',
      SYM_STATUS = 'u';

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
      stroke = undefined,
      eventWidth = undefined,
      eventPadding = DEFAULT_EVENT_PADDING,
      textInset = null,
      minIndex = undefined,
      maxIndex = undefined,
      indexFormat = undefined,
      tickInterval = undefined,
      timezone = undefined,
      wrapping = true;

  let pattern = diagonals(id ? `pattern-${id}` : 'pattern-schedule', patterns.diagonal2);
  pattern.foreground(PAL_PAJAMA2[1]);
  pattern.background(PAL_STRIPE);

  const PAL_STATUS = {
    proposed: '#1A74C1',
    conflict: '#E11010',
    provisional: [ PAL_STRIPE, pattern.url() ]
  };

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

    let _inset = coerceMargin(inset, { top: 0, bottom: 0, left: DEFAULT_INSET, right: 0 });
    let _text = coerceMargin(textInset, { 
                                    top: DEFAULT_TEXT_INSET, 
                                    bottom: DEFAULT_TEXT_INSET, 
                                    left: DEFAULT_TEXT_INSET, 
                                    right: Math.max(-eventPadding, DEFAULT_TEXT_INSET) 
                                  });
        
    let _fill = fill;
    if (_fill === undefined) {
      _fill = (d, i) => d[SYM_STATUS] ? (PAL_STATUS[d[SYM_STATUS]]) : PAL_PAJAMA2[i % PAL_PAJAMA2.length];
    } else if (typeof _fill === 'function') {
       // noop
    } else if (Array.isArray(fill)) {
      _fill = (d, i) => fill[ i % fill.length ];
    } else {
      _fill = () => fill;
    }
    
    let _stroke = stroke;
    if (_stroke === undefined) {
      _stroke = d => (d.index > 0) ? display.dark.text : null;
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
        
        let mn = minIndex;
        let mx = maxIndex;

        if (mn === undefined) {
          mn = min(provided, v => v[SYM_START]) || 0;
        }
        
        if (mx === undefined) {        
          mx = max(provided, v => v[SYM_END]) || 10000000;
        }
        
        let extent = [ mn, mx ];

        
        // create overlap indexes
        let maxOverlap = 0;
        let data = provided.map(function(d, i) {
            let index = 0;
            for (let pos = 0; pos < provided.length; pos++) {
                if (pos >= i) break;
                let t = provided[pos];
                
                let overlap = (t[SYM_START] >= d[SYM_START] && t[SYM_START] < d[SYM_END]) || 
                        (t[SYM_END] > d[SYM_START] && t[SYM_END] <= d[SYM_END]);
                if (overlap) 
                {
                  index = t.index + 1;
                  if (index > maxOverlap) maxOverlap = index;
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
        
        let svgNode = node.select(svgChart.self()).call(pattern).select(svgChart.child());

        // Create required elements
        let g = svgNode.select(_impl.self())
        if (g.empty()) {
          g = svgNode.append('g').attr('class', classed).attr('id', id);

          g.append('g').attr('class', 'axis');
          g.append('g').attr('class', 'events');
        }

        
        let _eventWidth = eventWidth;
        if (_eventWidth == null) {
           _eventWidth = Math.floor((w - _inset.left - _inset.right) / (maxOverlap + 1));
        }

        let y = scaleTime()
            .domain(extent)
            .rangeRound([_inset.top, h - _inset.bottom]);
        
        if (nice === true) {    
            y = y.nice();
        }

        let _tickInterval = tickInterval;
        if (_tickInterval == null) {
          let hours = (extent[1] - extent[0]) / (1000 * 60 * 60);
          if (hours < DEFAULT_TICKS_HOURS) {
            _tickInterval = [ utcMinute, 30 ];
          } else {
            _tickInterval = [ utcHour, Math.ceil(hours / DEFAULT_TICKS_HOURS)];
          }
        }

        let yAxis = axisLeft()
            .scale(y)
            .tickFormat(_indexFormat)
            .tickArguments(_tickInterval)
            .tickPadding(4)
            .tickSize(-w + _inset.left + _inset.right);

                    
        let grid = g.select('g.axis');
        
        if (transition === true) {
          grid = grid.transition(context);
        }
        
        grid.attr('transform', `translate(${_inset.left}, 0)`)
            .call(yAxis);
       
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
            .attr('stroke-opacity', d => _isMinor(d) ? 0.5 : 1.0) 
            .attr('stroke-width', d => _isMinor(d) ? widths.grid : widths.axis); 
         
        // Event rects
        let events = g.select('g.events').attr('transform', `translate(${_inset.left+widths.axis}, 0)`);

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
            
        event.attr('transform', d => `translate(${d.index * (_eventWidth + eventPadding)}, ${y(d[SYM_START])})`);

        event.select('rect')
            .attr('fill', (d, i) => {
              let f = _fill(d, i);
              if (Array.isArray(f)) return f[f.length - 1];
              return f;
            })
            .attr('stroke', _stroke)
            .attr('width', _eventWidth)
            .attr('height', d => y(d[SYM_END]) - y(d[SYM_START]));

        let txt = event.select('text')
            .attr('dominant-baseline', 'text-before-edge')
            .attr('fill', (d, i) => {
              if (d[SYM_STATUS]) {
                let f = _fill(d, i);
                if (Array.isArray(f)) f = f[0];
                return contrasts.white(f) ? display.dark.text : display.light.text;
              } 
              return PAL_TEXT;
            })
            .attr('x', _text.left)
            .attr('y', _text.top)
            .attr('width', _eventWidth - _text.left - _text.right)
            .attr('height', d => Math.max(y(d[SYM_END]) - y(d[SYM_START]) - _text.top - _text.bottom - 14, 12) /*fonts.fixed.sizeForWidth(w) worst case */);

        if (wrapping === true) {
          //TODO; Spacing hardcode for bricks
          let wrap = tspanWrap().spacing(7).text(d => d[SYM_TEXT]);            
          txt.call(wrap);
        } else {           
          txt.text(d => d[SYM_TEXT]);
        }                  
    });
  }

  _impl.self = function() { return 'g' + (id ?  '#' + id : '.' + classed); }

  _impl.id = function() {
    return id;
  };

  _impl.defaultStyle = (_theme, _width) => `
                  ${fonts.fixed.cssImport}  
                  ${_impl.self()} line,
                  ${_impl.self()} path { 
                                        shape-rendering: crispEdges; 
                                      }
                  ${_impl.self()} .events text { 
                                        font-family: ${fonts.fixed.family};
                                        font-size: ${fonts.fixed.sizeForWidth(_width)};   
                                        font-weight: ${fonts.fixed.weightMonochrome};               
                                      }                                              
                  ${_impl.self()} .axis text { 
                                        font-family: ${fonts.fixed.family};
                                        font-size: ${fonts.fixed.sizeForWidth(_width)};   
                                        font-weight: ${fonts.fixed.weightMonochrome};               
                                      }
                  ${_impl.self()} g.event rect {
                                        stroke-width: ${STROKE_PX}px;
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

  _impl.eventWidth = function(value) {
    return arguments.length ? (eventWidth = value, _impl) : eventWidth;
  }; 
  
  _impl.eventPadding = function(value) {
    return arguments.length ? (eventPadding = value, _impl) : eventPadding;
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

  _impl.wrapping = function(value) {
    return arguments.length ? (wrapping = value, _impl) : wrapping;
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

  _impl.minIndex = function(value) {
    return arguments.length ? (minIndex = value, _impl) : minIndex;
  };             

  _impl.maxIndex = function(value) {
    return arguments.length ? (maxIndex = value, _impl) : maxIndex;
  };  

  _impl.tickInterval = function(value) {
    return arguments.length ? (tickInterval = value, _impl) : tickInterval;
  }; 

  _impl.timezone = function(value) {
    return arguments.length ? (timezone = value, _impl) : timezone;
  };   
      
  return _impl;
}