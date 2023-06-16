'use strict';
const { addError } = require('markdownlint-rule-helpers');

function allTheSame(array, field) {
   if (array.length === 0) {
      return true;
   }
   return array.every((value) => { return value[field] === array[0][field]; });
}

function isUnordered(token) {
   return token.type === 'listItemPrefix' && !token.text.match('.*\\d+.*');
}

function filterByType(array, type) {
   return array.filter((value) => { return value.type === type; });
}

/**
 * This function is used to detect the relative indent a token should be at based on
 * different scenarios. Here is a summary:
 * 1. If token is an unordered list and parent is unordered, then we check the
 *    startColumn of the parent and add 'indent' setting to get the expected column.
 * 2. If token is a list then we use endColumn of a parent list item.
 * 3. If token is a blockquote, then we use endColumn of the parent blockquote
 *    (list checks take priority).
 * 4. If none of the above are true, then we base it on start_indent from settings.
 * @param token the token being checked. ie: unorderedList, orderedList, blockQuote,
 *              paragraph, etc...
 * @param settings object with 'startIndent' and 'indent' settings.
 * @param parentBlockQuote last blockQuote token processed.
 * @param parentListItem immediate parent list item.
 */
function getExpectedColumn(token, settings, parentBlockQuote, parentListItem) {
   let expectedColumn = settings.startIndent + 1;

   if (parentListItem) {
      expectedColumn = parentListItem.endColumn;
      if (token.type === 'listUnordered' && isUnordered(parentListItem)) {
         expectedColumn = parentListItem.startColumn + settings.indent;
      }
   } else if (parentBlockQuote) {
      expectedColumn = parentBlockQuote.endColumn;
   }

   return expectedColumn;
}

function processToken(token, settings, onError, previousItems) {
   const dataTokens = filterByType(token.children, 'data'),
         prefixTokens = filterByType(token.children, 'linePrefix'),
         listItemTokens = filterByType(token.children, 'listItemPrefix'),
         blockQuotePrefixTokens = filterByType(token.children, 'blockQuotePrefix'),
         codeFences = filterByType(token.children, 'codeFencedFence'),
         expectedColumn = getExpectedColumn(token, settings, previousItems.blockQuote, previousItems.listItem);

   // code fence rules
   if (codeFences.length !== 0) {
      if (!allTheSame(codeFences, 'startColumn') || token.startColumn !== expectedColumn) {
         addError(onError, token.startLine, 'Code fence has incorrect indentation.', token.text);
         return true;
      }
   }
   if (token.type === 'codeFence') {
      return false;
   }

   // Paragraph rules
   if (prefixTokens.length !== 0 && token.type === 'paragraph') {
      // If dataTokens exist, there must also be an equal amount of prefix tokens.
      if (!allTheSame(prefixTokens, 'startColumn') || dataTokens.length !== 0 && dataTokens.length !== prefixTokens.length) {
         addError(onError, token.startLine, 'Paragraph has unbalanced indentation.', token.text);
         return true;
      }
   }
   // list and sub-list rules
   if (listItemTokens.length !== 0) {
      if (!allTheSame(listItemTokens, 'startColumn') || token.startColumn !== expectedColumn) {
         addError(onError, token.startLine, 'List has incorrect indentation.', token.text);
         return true;
      }
   }

   if (blockQuotePrefixTokens.length > 1) {
      // TODO: one possible solution is if there are more than one blockQuotePrefix item
      //       per line, then split those out and check them separately in a loop.
      if (!allTheSame(blockQuotePrefixTokens, 'startColumn')) {
         addError(onError, token.startLine, 'BlockQuote has inconsistent indentation.', token.text);
         return true;
      }
   }
}

function traverseTokens(tokens, settings, tokensTypesToCheck, onError, previousItems) {
   previousItems = previousItems ? { ...previousItems } : { listItem: undefined, blockQuote: undefined };

   for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];

      if (token.type === 'listItemPrefix') {
         previousItems.listItem = token;
      } else if (token.type === 'blockQuote' && token.children) {
         previousItems.blockQuote = token.children[0];
      }

      if (tokensTypesToCheck.includes(token.type)) {
         if (processToken(token, settings, onError, previousItems)) {
            // If there was an error, skip checking children objects.
            if (token.type === 'blockQuote' && token.children) {
               previousItems.blockQuote = token.children[0];
            }
            continue;
         }
         if (token.type === 'blockQuote' && token.children) {
            previousItems.blockQuote = token.children[0];
         }
      }
      if (token.children && token.children.length > 0) {
         traverseTokens(token.children, settings, tokensTypesToCheck, onError, previousItems);
      }
   }
}

module.exports = {

   names: [ 'li-block-indent' ],
   description: 'List item block indentation',
   information: new URL('https://github.com/silvermine/markdownlint-rule-li-block-indent'),
   tags: [ 'bullet', 'ul', 'il', 'indentation' ],

   'function': function liBlockIndent(params, onError) {
      let tokensTypesToCheck = [ 'paragraph', 'listUnordered', 'listOrdered', 'blockQuote', 'codeFenced' ];

      const settings = {};

      settings.indent = Number(params.config.indent || 2);
      settings.startIndent = Number(params.config.start_indent || 0);

      traverseTokens(params.parsers.micromark.tokens, settings, tokensTypesToCheck, onError);
   },

};
