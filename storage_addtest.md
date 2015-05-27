# /storage/addtest #
**Description**: Adds a new test entry in the server.

**HTTP method**: post

**Parameters**:
```
{
  project: string // The project that the test belongs to.
  name: string // The test name.
  url_to_test: string // The start URL of the test.
  json: string // The test info JSON string.
}
```

**Returns**: The test id string.