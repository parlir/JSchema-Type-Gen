// JSON Schema code generation
import path from "path";
import fs from "fs";
import prettier from "prettier";
import { program } from "commander";
import jsonpointer from "jsonpointer";
import { JSONSchema7, JSONSchema7Definition } from "json-schema";

function assert(message, assertion) {
  let output;
  if (typeof assertion === "function") output = assertion();
  else if (typeof assertion === "boolean") output = assertion;
  if (!output) throw new Error(`Failed: '${message}'`);
}

function resolveRef(
  schemas: JSONSchema7[],
  rootSchema: JSONSchema7,
  ref: string
): JSONSchema7 {
  if (ref.startsWith("#/")) {
    return jsonpointer.get(rootSchema, ref.replace("#/", "/"));
  } else {
    throw new Error(`Not supporting external refs yet`);
  }
}

function generateTypeName(schema: JSONSchema7): string {
  assert("All schemas must have a title", schema.title !== undefined);
  const title = schema.title ?? "";
  return title.split(" ").join("_");
}

// Include the type info but without the top level wrappers
function generateTypeInfo(
  schemas: JSONSchema7[],
  rootSchema: JSONSchema7,
  schema: JSONSchema7
) {
  if (schema.$ref)
    return generateTypeInfo(
      schemas,
      rootSchema,
      resolveRef(schemas, rootSchema, schema.$ref)
    );
  switch (schema.type) {
    case "object":
      return `{${generateProperties(schemas, rootSchema, schema)}}`;
    case "number":
    case "integer":
      return "number";
    case "string":
      return "string";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "array": {
      if (
        schema.items === undefined ||
        (schema.items as JSONSchema7Definition[] | undefined)?.length === 0
      )
        return "any[]";
      else if (Array.isArray(schema.items))
        return `[${schema.items
          .map((i) => generateTypeInfo(schemas, rootSchema, i as JSONSchema7))
          .join(",")}]`;
      else if (typeof schema.items === "object")
        return `${generateTypeInfo(
          schemas,
          rootSchema,
          schema.items as JSONSchema7
        )}[]`;
    }
    default:
      throw new Error(`Unsupported schema '${JSON.stringify(schema)}'`);
  }
}

function generateProperties(
  schemas: JSONSchema7[],
  rootSchema: JSONSchema7,
  schema: JSONSchema7
) {
  assert(
    "Can only generate properties on object types",
    schema.type === "object"
  );
  const properties = schema.properties ?? {};
  return Object.keys(properties)
    .map(
      (name) =>
        `${name}${
          !schema.required?.includes(name) ? "?" : ""
        }: ${generateTypeInfo(
          schemas,
          rootSchema,
          properties[name] as JSONSchema7
        )};`
    )
    .join("");
}

const schemaToType = (
  schemas: JSONSchema7[],
  rootSchema: JSONSchema7,
  schema: JSONSchema7
): string => {
  const typeName = generateTypeName(schema);
  switch (schema.type) {
    case "object":
      return `export interface ${typeName} ${generateTypeInfo(
        schemas,
        rootSchema,
        schema
      )};`;
    case "number":
    case "integer":
    case "string":
    case "boolean":
    case "null":
    case "array":
      return `export type ${typeName} = ${generateTypeInfo(
        schemas,
        rootSchema,
        schema
      )}`;
    default:
      throw new Error(`Unsupported type ${schema.type}`);
  }
};

async function main() {
  program
    .version("0.0.1")
    .requiredOption("-s, --schemas [schemas...]", "Specify JSON Schemas")
    .requiredOption("-o, --output <path>", "Specify output file")
    .action(async (command, args) => {
      const schemaFilePaths: Array<string> = Array.from(
        command.schemas.reduce((schemas: Set<string>, filePath: string) => {
          if (fs.lstatSync(filePath).isDirectory()) {
            fs.readdirSync(filePath)
              .filter((v) => v.endsWith(".json"))
              .forEach((subFilePath) =>
                schemas.add(path.join(filePath, subFilePath))
              );
            return schemas;
          } else {
            schemas.add(filePath);
            return schemas;
          }
        }, new Set())
      );

      const schemas = schemaFilePaths.map(
        (path) => JSON.parse(fs.readFileSync(path, "utf8")) as JSONSchema7
      );

      const types = prettier.format(
        schemas
          .map((schema) => schemaToType(schemas, schema, schema))
          .join("\n"),
        { cursorOffset: 2, parser: "typescript" }
      );

      fs.writeFile(command.output, types, function (err) {
        if (err) return console.log(err);
      });
    });
  program.parseAsync(process.argv);
}

main().catch((e) => console.error(e));
