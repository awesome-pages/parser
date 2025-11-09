import { generateDomainV1JsonSchema } from './src/schemas/v1/jsonSchema';

const schema = {
    $id: "https://awesome-pages.github.io/schemas/domain/v1.json",
    ...generateDomainV1JsonSchema()
}
console.log(JSON.stringify(schema, null, 2));
