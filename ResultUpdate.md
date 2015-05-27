# /result/update #

**Description**: Updates the result on server.

**HTTP method**: post

**Parameters**:
```
{
  result: string // The result string containing runKey, testName and testId.
  status: string // success or failed
  screenshot: string // The data url.
  log: string // Any log.
}
```