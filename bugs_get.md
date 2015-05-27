# /bugs/get #

**Description**: Gets a list of bugs based on id, provider, and project

**HTTP method**: get

**Parameters**:

  * id: The ID of the bug to fetch.
  * provider: The provider of the bug.
  * project: Optional. The status of the bug to retrieve.

**Returns**: A JSON BITE bug, or an empty string if no bug is found.