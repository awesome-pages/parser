import { zodToJsonSchema } from 'zod-to-json-schema';
import { DomainV1Base } from './domain.v1';

/**
 * Gera o JSON Schema para DomainV1
 * Usa o schema base (sem transforms) que representa a estrutura final
 */
export function generateDomainV1JsonSchema() {
	return zodToJsonSchema(DomainV1Base, {
		name: 'awesome-pages-domain.v1',
		$refStrategy: 'none',
	});
}
