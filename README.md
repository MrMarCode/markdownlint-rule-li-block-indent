# markdownlint-rule-li-block-indent

<!-- markdownlint-disable line-length -->
[![NPM Version](https://img.shields.io/npm/v/@silvermine/markdownlint-rule-li-block-indent.svg)](https://www.npmjs.com/package/@silvermine/markdownlint-rule-li-block-indent)
[![License](https://img.shields.io/github/license/silvermine/markdownlint-rule-li-block-indent.svg)](./LICENSE)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
<!-- markdownlint-enable line-length -->

## What?

A custom [markdownlint](https://github.com/DavidAnson/markdownlint) rule to lint
multi-line blocks or paragraphs both inside and outside of list items.
For example, incorrect wrapping looks like:

```markdown
Lorem ipsum dolor sit amet, consectetur adipiscing elit.
   Etiam placerat metus nisi, at eleifend nisl efficitur non. Nullam egestas, velit eu
viverra.

   * Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam placerat
   metus nisi, at eleifend nisl efficitur non. Nullam egestas, velit eu viverra.
   * vestibulum, lorem enim aliquam nisl,
  malesuada ornare purus nisi ut erat.
   * Mauris laoreet nibh magna, vel accumsan felis accumsan a. Suspendisse nec
      rhoncus massa, quis vehicula est.

>> * ul item
  >> bad indent
> * ul item
    > bad indent

* ul item

 > bad indent
```

Correct wrapping example:

```markdown
Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Etiam placerat metus nisi, at eleifend nisl efficitur non. Nullam egestas, velit eu
viverra.

   * Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam placerat
     metus nisi, at eleifend nisl efficitur non. Nullam egestas, velit eu viverra.
   * vestibulum, lorem enim aliquam nisl,
     malesuada ornare purus nisi ut erat.
   * Mauris laoreet nibh magna, vel accumsan felis accumsan a. Suspendisse nec
     rhoncus massa, quis vehicula est.

>> * ul item
>>   good indent
> * ul item
>   good indent

* ul item

  > Good indent
```

This also works with multiline fenced codeblocks. However, only the opening and closing
quotes are linted. For example:

```markdown
   * The opening/closing lines below here are checked...
     ```
        but indentation inside here is not checked by this rule.
     ```
```

One case that is not covered is the following:

```markdown
>> * ul item
>  > indented paragraph.
```

You'll notice that there are 2 spaces. However, because they are sandwiched in between 2
blockquote symbols those spaces are not detected by this rule. Therefore, it is flagged
as if it had no spaces. This has not been fixed because we could not think of a practical
reason why someone would want to do this.

## Why?

It's easier to read and informs the developer when they've added the wrong amount of
spaces. This potentially prevents rendering issues.

## Usage

To use this custom markdownlint rule two things needed:

   1. Update your [markdownlint config][markdownlint-config] to include
      `"li-block-indent": true`
   2. Add this rule to the list of [custom markdownlint rules][custom-rules-config].
      If using markdownlint-cli, this would look something like:
      `markdownlint -r 'src/li-block-indent.js' -c .markdownlint.json README.md`

[markdownlint-config]: https://github.com/DavidAnson/markdownlint#optionsconfig
[custom-rules-config]: https://github.com/DavidAnson/markdownlint#optionscustomrules

## License

This software is released under the MIT license. See [the license file](LICENSE) for more
details.
