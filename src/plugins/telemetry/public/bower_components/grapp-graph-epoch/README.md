grapp-graph-epoch
=================

A web component that displays [Epoch graphs](https://github.com/fastly/epoch).
For more information about how the graphs are actually displayed and the details of the
web comonent attributes, please refer to the [Epoch documentation](http://fastly.github.io/epoch/).

Compatible with Polymer 1.0+


Properties
----------

  * **type**

    - *type:* (time.)? area|bar|gauge|heatmap|line
    - *default:* undefined

    Specify the Epoch graph type.
    

  * **axis**

    - *type:* (left|bottom|right|top)*
    - *default:* left,buttom

    Specify which axes should be printed.
    

  * **theme**

    - *type:* default|dark
    - *default:* default

    Select one of the two Epoch CSS themes.
    

  * **category**

    - *type:* category10|category20|category20b|category20c
    - *default:* category10

    Select one of the four D3 categorical color sets.
    

  * **width**

    - *type:* Width in pixel
    - *default:* Automatically calculated

    Defines the graph width.


  * **height**

    - *type:* Height in pixel
    - *default:* Automatically calculated

    Defines the graph height.


  * **ticks**

    - *type:* List of name:number pairs
    - *default:* Epoch default

    Number of ticks to display on each axis, for example `ticks="left:10,bottom:20"`


  * **tickSize**

    - *type:* Number
    - *default:* Epoch default

    Size in pixels for each tick (for gauge chart).


  * **tickOffset**

    - *type:* Number
    - *default:* Epoch default

    Number of pixels to offset ticks by from the outter arc of the gauge (for gauge charts).


  * **windowSize**

    - *type:* Number
    - *default:* Epoch default

    Number of entries to display in the graph (for real-time-charts).


  * **historySize**

    - *type:* Number
    - *default:* Epoch default

    Maximum number of historical entries to track in the chart (for real-time-charts).


  * **queueSize**

    - *type:* Number
    - *default:* Epoch default

    Number of entries to keep in working memory while the chart is not animating transitions (for real-time-charts).


  * **margins**

    - *type:* List of name:number pairs
    - *default:* Epoch default

    Explicit margin overrides for the chart, for example `maargins="left:10,bottom:20"`


  * **domain**

    - *type:* min,max pair
    - *default:* Automatically calcualted

    Set an explicit domain for the chart.


  * **range**

    - *type:* min,max pair
    - *default:* Automatically calcualted

    Set an explicit range for the chart.


Methods
-------

  * **push(time, value)**

    Push a new value into a data series.


  * **clear()**

    Clear a time series graph.


grapp-graph-epoch-series
========================

Defines a single data series inside an grapp-graph-epoch.


Properties
----------

  * **label**

    - *type:* String
    - *default:* ''

    The series label


  * **data**

    - *type:* Array of {x:, y:} pairs
    - *default:* undefined
