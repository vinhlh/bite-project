# /get\_bugs\_for\_url #
**Description**: Gets a list of bugs for the current url.

**HTTP method**: get

**Parameters**:

  * target\_url: Required.
  * state: Optional.  State of the bugs to retrieve. If no value is specified, the list of bugs returned will not be filtered based on state.
  * status: Optional. Status of the bugs to retrieve. If no value is specified, the list of bugs returned will not be filtered based on status.

**Returns**: JSON:
```
 [ <BITE bug>, <BITE bug>, ... ]
```