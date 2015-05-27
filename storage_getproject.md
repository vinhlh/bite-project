# /storage/getproject #

**Description**: Gets all of the tests and project details info of the given project.

**HTTP method**: post

**Parameters**:
```
{
  name: string // The project name.
}
```

**Returns**:
```
{
  project_details: Object // The details of the project.
  tests: Array // The array of tests.
}
```