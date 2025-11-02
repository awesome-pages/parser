import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

describe('computeDeterministicItemId', () => {
  it('should generate a simple slug from title', async () => {
    const { computeDeterministicItemId } = await import(
      '@/core/helpers/computeDeterministicItemId'
    );
    const id = computeDeterministicItemId('tools', 'ChatGPT');
    expect(id).toBe('chatgpt');
  });

  it('should ensure uniqueness inside the same section', async () => {
    const { computeDeterministicItemId } = await import(
      '@/core/helpers/computeDeterministicItemId'
    );
    const id1 = computeDeterministicItemId('tools', 'ChatGPT');
    const id2 = computeDeterministicItemId('tools', 'ChatGPT');
    const id3 = computeDeterministicItemId('tools', 'ChatGPT');
    expect(id1).toBe('chatgpt');
    expect(id2).toBe('chatgpt-2');
    expect(id3).toBe('chatgpt-3');
  });

  it('should reset uniqueness across sections', async () => {
    const { computeDeterministicItemId } = await import(
      '@/core/helpers/computeDeterministicItemId'
    );
    const idTools = computeDeterministicItemId('tools', 'ChatGPT');
    const idColors = computeDeterministicItemId('colors', 'ChatGPT');
    expect(idTools).toBe('chatgpt');
    expect(idColors).toBe('chatgpt'); // diferente seção → permitido
  });

  it('should normalize special characters and accents', async () => {
    const { computeDeterministicItemId } = await import(
      '@/core/helpers/computeDeterministicItemId'
    );
    const id = computeDeterministicItemId('colors', 'Café com Açúcar!');
    expect(id).toBe('cafe-com-acucar');
  });

  it('should handle titles producing the same slug with numeric suffixes', async () => {
    const { computeDeterministicItemId } = await import(
      '@/core/helpers/computeDeterministicItemId'
    );
    computeDeterministicItemId('tools', 'Notion');
    computeDeterministicItemId('tools', 'Notion');
    const id = computeDeterministicItemId('tools', 'Notion');
    expect(id).toBe('notion-3');
  });
});
