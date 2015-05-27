# /get\_my\_compat\_test #
**Description**: Gets test suites for the logged in user.

**HTTP method**: get

**Parameters**: none

**Returns**: JSON:
```
{
  user: string // The's logged in user's e-mail
  test: 
  {
    test_id: string // Name for the test.
    test_url: string // URL where this test should begin.
    verification_steps: string // Steps that must be performed for this test.
  }
}
```