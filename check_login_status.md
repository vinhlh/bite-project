# /check\_login\_status #

**Description**: Most actions by the BITE client require that the user be logged in. This handler checks login status and returns the user's e-mail.

**HTTP method**: get
**Parameters**: none
**Returns**: JSON:
```
{
  loggedIn: bool // Whether the user is logged in or not.
  user: string // The user's e-mail.
  url: string // A URL where a user can log in or log out.
}
```