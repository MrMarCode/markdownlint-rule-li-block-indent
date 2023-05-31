'use strict';

const { expect } = require('chai');

const { markdownlint } = require('markdownlint').promises,
      liBlockIndent = require('../src/li-block-indent');

async function runTest(lines) {
   const text = lines.join('\n');

   return markdownlint({
      config: {
         default: false,
         'li-block-indent': true,
      },
      customRules: [ liBlockIndent ],
      strings: {
         text,
      },
   });
}

async function testValidExample(lines) {
   expect((await runTest(lines)).text).to.eql([]);
}

async function testInvalidExample(expectedErrorCount, lines) {
   const results = await runTest(lines),
         message = `Expected ${expectedErrorCount} errors but found ${JSON.stringify(results.text)}`;

   expect(results.text).to.have.length(expectedErrorCount, message);
}

describe('List Item Block Indentation', () => {
   it('reports no errors for left-aligned paragraphs', async () => {
      await testValidExample([
         'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
         'Pellentesque vestibulum lectus non tellus congue,',
         'eu ultricies metus ultrices.',
         '',
         'Curabitur ut posuere est, quis convallis orci.',
         'Nam lectus magna, pellentesque at rutrum in, commodo a nisi.',
      ]);
   });

   it('reports errors for misaligned paragraphs', async () => {
      await testInvalidExample(2, [
         '    Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
         'Pellentesque vestibulum lectus non tellus congue,',
         '  eu ultricies metus ultrices.',
         '',
         'Curabitur ut posuere est, quis convallis orci.',
         '   Nam lectus magna, pellentesque at rutrum in, commodo a nisi.',
      ]);
   });

   it('properly validates indented paragraphs', async () => {
      await testValidExample([
         '',
         '  * ul item',
         '  * ul item',
         '    continued paragraph',
         '    continued paragraph',
         '    * ul item',
         '      continued paragraph',
         '  * ul item',
         '    continued paragraph',
         '  1. ol item',
         '     continued paragraph',
      ]);
   });

   it('properly invalidates indented paragraphs', async () => {
      await testInvalidExample(5, [
         '',
         '  * ul item',
         '  * ul item',
         ' continued paragraph',
         ' continued paragraph',
         '    * ul item',
         '     continued paragraph',
         '  * ul item',
         'continued paragraph',
         '  1. ol item',
         '       continued paragraph',
      ]);
   });

   it('properly validates indented paragraphs with blockquotes', async () => {
      await testValidExample([
         'Test',
         '   * **Message:**',
         '',
         '     > a\\',
         '     > b',
         '     > c',
         '',
      ]);
   });

   it('properly invalidates indented paragraphs with blockquotes', async () => {
      await testInvalidExample(5, [
         '',
         '>> * ul item',
         '>> * ul item',
         '    >> continued paragraph',
         '    >> continued paragraph',
         '>> * ul item',
         '      >> continued paragraph',
         '>  * ul item',
         '      > continued paragraph',
         '> 1. ol item',
         '>    continued paragraph',
         '',
         '* ul item',
         '',
         ' > indented blockquote',
      ]);
   });

   it('properly validates indented code blocks', async () => {
      await testValidExample([
         '',
         '   * ul item',
         '   * ul item',
         '     continued paragraph',
         '     ```',
         '                  This content is not checked();',
         '             not checked();',
         '            not checked();',
         '             not checked();',
         '     ```',
         '     * ul item',
         '       continued paragraph',
         '   * ul item',
         '     continued paragraph',
         '   1. ol item',
         '      continued paragraph',
      ]);
      await testValidExample([
         '```',
         '              This content is not checked();',
         '          not checked();',
         '         not checked();',
         '      not checked();',
         '```',
      ]);
   });

   it('properly invalidates indented code blocks', async () => {
      await testInvalidExample(2, [
         '',
         '   * ul item',
         '   * ul item',
         '     continued paragraph',
         '      ```',
         '                  This content is not checked();',
         '             not checked();',
         '            not checked();',
         '             not checked();',
         '      ```',
         '     * ul item',
         '       continued paragraph',
         '   * ul item',
         '     continued paragraph',
         '   1. ol item',
         '      continued paragraph',
      ]);

      await testInvalidExample(2, [
         ' ```',
         '              This content is not checked();',
         '          not checked();',
         '         not checked();',
         '      not checked();',
         '  ```',
      ]);
   });

   it('properly invalidates indented opening code block', async () => {
      await testInvalidExample(1, [
         '',
         '   * ul item',
         '   * ul item',
         '     continued paragraph',
         '     continued paragraph',
         '     continued paragraph',
         '      ``` testingCode();```',
         '     * ul item',
         '       continued paragraph',
         '   * ul item',
         '     continued paragraph',
         '   1. ol item',
         '      continued paragraph',
      ]);
   });

   it('ignores invalid sublist indentation', async () => {
      await testValidExample([
         '',
         '   1. ol item',
         '   2. ol item',
         '     * test',
      ]);
   });

   it('validates 3 space indent', async () => {
      await testValidExample([
         '',
         '## Legal Offices Page',
         '',
         '   * Includes body content and a [**Contact Information Chooser**](#TODO) for legal office',
         '     contact information',
      ]);
   });

   it('properly validates starting fenced code', async () => {
      await testValidExample([
         '',
         '   * ul item',
         '   * ul item',
         '     continued paragraph',
         '     ```',
         '                  This content is not checked();',
         '             not checked();',
         '            not checked();',
         '             not checked();',
         '             not checked();',
      ]);
   });
});
