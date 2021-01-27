# JSchema-Type-Gen

Generate Typescript types based on JSON schemas.

```shell
node lib/index.js --schemas <schema paths> --output <output ts file>
```

## Example

### Schema
Example Schemas are in test directory. Can reuse schemas (both external and local resolution using $ref).
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
    "from0to5": {
      "type": "string",
      "enum": [0, 1, 2, 3, 4, 5]
    },
    "title": {
      "type": "string",
      "enum": ["mr", "mrs", "ms"]
    },
    "geography": {
      "$ref": "#https://example.com/geographical-location.schema.json"
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
```json
{
  "$id": "https://example.com/geographical-location.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Longitude and Latitude Values",
  "description": "A geographical coordinate.",
  "required": [ "latitude", "longitude" ],
  "type": "object",
  "properties": {
    "latitude": {
      "type": "number",
      "minimum": -90,
      "maximum": 90
    },
    "longitude": {
      "type": "number",
      "minimum": -180,
      "maximum": 180
    }
  }
}

```

### Generated TS type 
```ts
// A geographical coordinate.
export interface Longitude_and_Latitude_Values {
  latitude: number;
  longitude: number;
}
export interface Person {
  // The person's first name.
  firstName?: string;
  from0to5?: 0 | 1 | 2 | 3 | 4 | 5;
  title?: "mr" | "mrs" | "ms";
  geography?: Longitude_and_Latitude_Values;
  tuple?: [number, string];
  array?: number[];
  myRef?: { reference?: string };
  // Complex last name
  lastName?: { init: string; last: string };
  // Age in years which must be equal to or greater than zero.
  age?: number;
}
```
