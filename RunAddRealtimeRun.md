# /run/add\_realtime\_run #

**Description**: Add a real time run.

**HTTP method**: post

**Parameters**:
```
{
  runName: string // The run name.
  projectName: string // The project name.
  suiteName: string // The suite name.
  userAgent: string // The user agent string.
  testInfoList: string // Other test result info.
}
```

**Returns**:
```
string // The run key.
```