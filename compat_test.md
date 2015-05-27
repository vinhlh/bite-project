# /compat/test #
**Description**: Logs a test result to the server

**HTTP method**: post

**Parameters**:
```
{
  skipped: string // Optional. The id of the test that was skipped.
  passResult: string // Optional. The id of the test that passed.
  failResult: string // Optional. The id of the test that failed.
  'comment_' + testId: string // A comment on the failure.
  'bugs_' + testId: string // Bugs which failed.
}
```

**Returns**: unused