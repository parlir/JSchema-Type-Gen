// JSON Schema code generation
import prettier from "prettier";
import fs from "fs";
import { program } from "commander";
import { JSONSchema7 } from "json-schema";

function assert(message, assertion) {
  let output;
  if (typeof assertion === "function") output = assertion();
  else if (typeof assertion === "boolean") output = assertion;
  if (!output) throw new Error(`Failed: '${message}'`);
}

function generateTypeName(schema: JSONSchema7): string {
  assert("All schemas must have a title", schema.title !== undefined);
  const title = schema.title ?? "";
  return title.split(" ").join("_");
}

function generateProperties(schemas: JSONSchema7[], schema: JSONSchema7) {
  assert(
    "Can only generate properties on object types",
    schema.type === "object"
  );
  const properties = schema.properties ?? {};
  return Object.keys(properties)
    .map(
      (name) =>
        `${name}${!schema.required?.includes(name) ? "?" : ""}: ${
          (properties[name] as JSONSchema7)?.type
        };`
    )
    .join("");
}

const schemaToType = (schemas: JSONSchema7[]) => (
  schema: JSONSchema7
): string => {
  switch (schema.type) {
    case "object":
      return `export interface ${generateTypeName(
        schema
      )} {${generateProperties(schemas, schema)}};`;
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
      console.log(command.output, command.schemas);
      const schemas = command.schemas.map(
        (path) => JSON.parse(fs.readFileSync(path, "utf8")) as JSONSchema7
      );

      const types = prettier.format(
        schemas.map(schemaToType(schemas)).join("\n"),
        { cursorOffset: 2, parser: "typescript" }
      );

      fs.writeFile(command.output, types, function (err) {
        if (err) return console.log(err);
      });
    });
  program.parseAsync(process.argv);
}

main().catch((e) => console.error(e));
