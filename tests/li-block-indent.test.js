'use strict';

const { expect } = require('chai');

const { markdownlint } = require('markdownlint').promises,
      liBlockIndent = require('../src/li-block-indent');

describe('List Item Block Indentation', () => {

   it('properly validates the indentation of list item blocks', async () => {
      const results = await markdownlint({
         config: { default: false },
         customRules: [ liBlockIndent ],
         strings: {
            text: ''
               + '  * ul item\n'
               + '    ul item\n'
               + '    1. ol item\n'
               + '       ol item\n'
               + '       * ul item\n'
               + '         ul item\n',
         },
      });

      expect(results.text).to.be.eql([]);
   });

});
