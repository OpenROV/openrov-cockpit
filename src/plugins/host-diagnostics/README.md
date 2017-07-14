Host Diagnostics is a plugin that exposes information about the computer that the node process is running on.

Host Diagnostics provides some REST API end points for quick checks

### Blink the lights on the ROV
This is useful if you have more than one ROV connected to the same network

>curl -X POST http://localhost:8080/blink
```
"OK"
```

### Reset Pressure test data
The system always tracks this data, but if you want an explicit test, this resets all of the data

>curl -X POST http://localhost:8080/pressure_test/reset
```
"OK"
```

### Details of internal pressure (only works if a barometer is present):

>curl http://localhost:8080/pressure_test
```
{
    "rate_1_minute": 201438,            //Change in pressure over the related time period
    "rate_10_minute": -242299,
    "rate_20_minute": -242299,
    "current_pressure": {
        "timestamp": 1499937132530,
        "baro_p": "30228456",           //Pressure
        "baro_t": "0"                   //Temperature
    },
    "available_sample_duration": 73074  //Duration of milliseconds between the first and last sample available
}
```