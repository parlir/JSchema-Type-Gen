# JSchema-Type-Gen

Generate Typescript types based on JSON schemas.

```shell
node lib/index.js --schemas <schema paths> --output <output ts file>
```

## Example

### Schema
```json
{
  "$id": "https://example.com/person.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Person",
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string",
      "description": "The person's first name."
    },
    "tuple": {
      "type": "array",
      "items": [{ "type": "number" }, { "type": "string" }]
    },
    "array": {
      "type": "array",
      "items": {
        "type": "integer"
      }
    },
    "myRef": {
      "$ref": "#/definitions/reference"
    },
    "lastName": {
      "type": "object",
      "required": ["init", "last"],
      "properties": {
        "init": {
          "type": "string"
        },
        "last": {
          "type": "string"
        }
      },
      "description": "Complex last name"
    },
    "age": {
      "description": "Age in years which must be equal to or greater than zero.",
      "type": "integer",
      "minimum": 0
    }
  },
  "definitions": {
    "reference": {
      "type": "object",
      "properties": {
        "reference": { "type": "string" }
      }
    }
  }
}
```

### Generated TS type 
```ts
export interface Person {
  firstName?: string;
  tuple?: [number, string];
  array?: number[];
  myRef?: { reference?: string };
  lastName?: { init: string; last: string };
  age?: number;
}
```
