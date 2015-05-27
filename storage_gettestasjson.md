# /storage/gettestasjson #
**Description**: Gets the test info from server.

**HTTP method**: get

**Parameters**:
```
{
  id: string // The test id.
}
```

**Returns**:
```
{
  name: string // The test name.
  url: string // The URL.
  script: string // The test script string.
  datafile: string // The data input info.
  id: string // The test id.
  projectname: string // The project name.
}
```