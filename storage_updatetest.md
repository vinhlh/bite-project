# /storage/updatetest #

**Description**: Updates the test entry in the server.

**HTTP method**: post

**Parameters**:
```
{
  id: string // The test id.
  project: string // The project that the test belongs to.
  name: string // The test name.
  url_to_test: string // The start URL of the test.
  json: string // The test info JSON string.
}
```

**Returns**: unused.