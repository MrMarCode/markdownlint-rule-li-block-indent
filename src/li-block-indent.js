'use strict';
const { addErrorDetailIf, indentFor, listItemMarkerRe } = require('markdownlint-rule-helpers');

const orderedItemMarkerRe = /^(\s[*-+])0*(\d+)[.)]/;

/**
 * Return the number of characters of indent for a token. This implementation is
 * different in that it does not account for blockquote symbols like the one from
 * markdownlint-rule-helpers.
 *
 * @param {Object} token MarkdownItToken instance.
 * @returns {number} Characters of indent.
 */
function indentBeforeBlockquoteFor(token) {
   return token.line.length - token.line.trimStart().length;
}

/**
 * Given a list item token, calculate the expected indentation for a sub-list.
 * According to the markdown spec, the indentation is marker width + trailing spaces. ie:
 * "1. li" = 3
 * "10. li" = 4
 * "10.  li" = 5
 * "* li" = 2
 * @param {object} token - list item token.
 * @returns {number} list item marker width. indicates indentation for sub lists.
 */
function getSubListIndentation(token) {
   let markerWidth = 0;

   if (token.type !== 'list_item_open') {
      return markerWidth;
   }

   let marker = token.info + token.markup;

   // info is empty for unordered lists, but contains the number chars for ordered lists.
   markerWidth += marker.length;

   if (marker === '*') {
      marker = `[${marker}]`;
   }

   const spacesRegex = new RegExp(`^(?:[^\\n*.\\d\\w]*)(${marker})(\\s*)`);

   const spacesAfterMarker = token.line.match(spacesRegex);

   if (spacesAfterMarker) {
      markerWidth += spacesAfterMarker[2].length;
   }

   return markerWidth;
}

module.exports = {

   names: [ 'li-block-indent' ],
   description: 'List item block indentation',
   information: new URL('https://github.com/silvermine/markdownlint-rule-li-block-indent'),
   tags: [ 'bullet', 'ul', 'il', 'indentation' ],

   'function': function liBlockIndent(params, onError) {
      const stack = [];

      let current = null;

      for (const token of params.tokens) {
         if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
            // Save current context and start a new one
            stack.push(current);
            current = {
               indent: indentFor(token),
               items: [],
            };
         } else if (token.type === 'bullet_list_close' || token.type === 'ordered_list_close') {
            // restore previous context
            current = stack.pop();
         } else if (token.type === 'list_item_open') {
            current.items.push(token);
         } else if (token.type === 'fence') {
            // This block checks the opening and closing fence for indentation
            let expectedIndent = 0;

            if (current !== null) {
               const lastToken = current.items[current.items.length - 1];

               expectedIndent = current.indent + getSubListIndentation(lastToken);
            }

            const subFenceItems = token.content.split('\n');

            if (subFenceItems.length > 1) {
               const endingFenceLineNumber = token.lineNumber + subFenceItems.length;

               const startingFenceIndent = indentFor({ line: params.lines[token.lineNumber - 1] });

               addErrorDetailIf(onError, token.lineNumber, expectedIndent, startingFenceIndent, null, null);

               const endingFenceLine = params.lines[endingFenceLineNumber - 1];

               // The spec allows you to omit closing fence. Therefore, we need to check
               // if a closing fence exists before testing it's indentation length.
               if (endingFenceLine.includes('```') || endingFenceLine.includes('~~~')) {
                  const endingFenceIndent = indentFor({ line: params.lines[endingFenceLineNumber - 1] });

                  addErrorDetailIf(onError, endingFenceLineNumber, expectedIndent, endingFenceIndent, null, null);
               }
            }
         } else if (token.type === 'inline' && token.children.length > 0) {
            let lastToken,
                expectedIndent;

            if (current) {
               lastToken = current.items[current.items.length - 1];
               expectedIndent = current.indent + getSubListIndentation(lastToken);
            } else if (token.level === 1 || current === null) {
               expectedIndent = 0;
            }

            token.children.reduce((linesProcessed, child) => {
               // Avoid a child without a line or a line that's already been processed.
               if (child.line === undefined || linesProcessed.includes(child.lineNumber)) {
                  return linesProcessed;
               }

               linesProcessed.push(child.lineNumber);
               if (child.line.match(listItemMarkerRe) || child.line.match(orderedItemMarkerRe)) {
                  // Another rule handles checking sub-lists, so we ignore them here.
                  return linesProcessed;
               }

               let actualIndent = indentFor(child);

               const indentBeforeBlockquote = indentBeforeBlockquoteFor(child);

               // We want to check indentation before and after any blockquotes, but not
               // both at the same time. This checks indentation before block quotes in
               // 2 cases:
               // 1. If we're not in a list (current === null) and the indentation after
               //    a blockquote is correct.
               // 2. If indentation after a blockquote is wrong.
               if (current === null && actualIndent === expectedIndent || actualIndent !== expectedIndent) {
                  actualIndent = indentBeforeBlockquote;
               }

               addErrorDetailIf(onError, child.lineNumber, expectedIndent, actualIndent, null, child.line);
               return linesProcessed;
            }, []);
         }
      }
   },

};
