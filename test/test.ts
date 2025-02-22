import scrapboxToReView, { type ConverterOption } from "../mod.ts";
import { asserts } from "./test_helper.ts";

const { assertEquals } = asserts;

function assertConvertion(
  sbContent: string,
  reviewCode: string,
  option: ConverterOption = {},
) {
  const logger = option.logger || {
    error(message: string) {
      console.error(message);
    },
    warn(_message: string) {},
  };
  assertEquals(
    scrapboxToReView(sbContent, Object.assign({}, option, { logger })).trim(),
    reviewCode.trim(),
  );
}

Deno.test("Heading", () => {
  const sbContent = `hoge
[*** hoge]
[** fuga]
[* piyo]`;
  const reviewCode = `= hoge

== hoge

=== fuga

@<strong>{piyo}`;
  assertConvertion(sbContent, reviewCode);
});

Deno.test("Heading with baseHeadingLevel", () => {
  const sbContent = `hoge
[**** hoge]
[*** fuga]`;
  const reviewCode = `= hoge

== hoge

=== fuga
`;
  assertConvertion(sbContent, reviewCode, { baseHeadingLevel: 4 });
});

Deno.test("Decoration", () => {
  const sbContent = "[[Bold]][* Bold{}{}\\][**/- BoldStrikeItalic]";
  const reviewCode =
    "@<strong>{Bold}@<strong>{Bold{\\}{\\}\\\\}@<strong>{@<del>{@<i>{BoldStrikeItalic}}}";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("External Link", () => {
  const sbContent =
    "https://google.com [https://google.com/,{}] [https://google.com G,{}] [G https://google.com]";
  const reviewCode =
    "@<href>{https://google.com} @<href>{https://google.com/\\,{\\}} @<href>{https://google.com, G\\,{\\}} @<href>{https://google.com, G}";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Link across projects", () => {
  const sbContent = "[/projectname][/projectname/pagename]";
  const reviewCode =
    "@<href>{https://scrapbox.io/projectname}@<href>{https://scrapbox.io/projectname/pagename}";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Inline code", () => {
  const sbContent = "`\\code{}\\`";
  const reviewCode = "@<code>{\\code{\\}\\\\}";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Formula", () => {
  const sbContent = "The answer should be [$ x = \\frac{1}{2}]";
  const reviewCode = "The answer should be @<m>{x = \\frac{1\\}{2\\}}";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Formula in itemization", () => {
  const sbContent = " [$ x = \\frac{1}{2}]";
  const reviewCode = " * @<m>{x = \\frac{1\\}{2\\}}";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Block formula", () => {
  const sbContent = "[$ x = \\frac{1}{2}]";
  const reviewCode = `//texequation{
x = \\frac{1}{2}
//}`;
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Multiline text", () => {
  const sbContent = "hoge\nfuga";
  const reviewCode = `hoge

fuga`;
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Itemization", () => {
  const sbContent = `foo
 hoge
\t\tfuga
  piyo
foo`;
  const reviewCode = `foo

 * hoge
 ** fuga
 ** piyo

foo`;
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Block Quote", () => {
  const sbContent = `>hoge
>hoge[* fuga]
foo
`;
  const reviewCode = `//quote{
hoge
hoge@<strong>{fuga}
//}

foo`;
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Command line", () => {
  const sbContent = `$ cmd
% cmd`;
  const reviewCode = `//cmd{
$ cmd
//}

//cmd{
% cmd
//}`;
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Command line inside itemization", () => {
  const sbContent = "	$ aaa\n	 % bbb\n";
  const reviewCode = " * @<code>{$ aaa}\n ** @<code>{% bbb}";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Code block", () => {
  const sbContent = `code:a.js[]
 function a() {
     console.log("hoge");
 }
foo`;
  const reviewCode = `//emlist[a.js[\\]]{
function a() {
    console.log("hoge");
}
//}

foo`;
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Table", () => {
  const sbContent = `table:title[]
 abc\tdef
 aaaaaaaaaaaa\tbbbbbb
 col1\tcol2
text`;
  const reviewCode = `//emtable[title[\\]]{
abc\tdef
------------
aaaaaaaaaaaa\tbbbbbb
col1\tcol2
//}

text`;
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Image", () => {
  const sbContent = `[https://scrapbox.io/files/aaaaa.jpg]
[[https://scrapbox.io/files/bbbbb.jpg]]
hoge[https://scrapbox.io/files/bbbbb.jpg]fuga
foo[[https://scrapbox.io/files/bbbbb.jpg]]bar`;
  const reviewCode = `//indepimage[https://scrapbox.io/files/aaaaa.jpg]

//indepimage[https://scrapbox.io/files/bbbbb.jpg]

hoge@<icon>{https://scrapbox.io/files/bbbbb.jpg}fuga

foo@<icon>{https://scrapbox.io/files/bbbbb.jpg}bar`;
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Icon", () => {
  const sbContent = "[hoge.icon][/help-jp/Scrapbox.icon][[fuga.icon]]";
  const reviewCode =
    `@<icon>{hoge.icon}@<icon>{/help-jp/Scrapbox.icon}@<icon>{fuga.icon}`;
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Empty list item", () => {
  const sbContent = "test\n \ntest2";
  const reviewCode = "test\n\n * \n\ntest2";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("code block after itemization", () => {
  // In Re:VIEW format, newline should exist after itemization
  const sbContent = `\taaa
code:js
 const a = "";`;
  const reviewCode = ` * aaa

//emlist[js]{
const a = "";
//}`;
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("code block and table after itemization", () => {
  // In Re:VIEW format, newline should exist after itemization
  const sbContent1 = `\taaa
code:js
 const a = "";`;
  const reviewCode1 = ` * aaa

//emlist[js]{
const a = "";
//}`;
  assertConvertion(sbContent1, reviewCode1, { hasTitle: false });

  const sbContent2 = `\taaa
table:hoge
 aaa

`;
  const reviewCode2 = ` * aaa

//emtable[hoge]{
aaa
------------

//}`;
  assertConvertion(sbContent2, reviewCode2, { hasTitle: false });
});

Deno.test("Block quote in the last line", () => {
  // In Re:VIEW format, newline should exist after itemization
  const sbContent = ">aaa";
  const reviewCode = "//quote{\naaa\n//}";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Itemization after block quote", () => {
  // In Re:VIEW format, newline should exist after itemization
  const sbContent = ">aaa\n\thoge";
  const reviewCode = "//quote{\naaa\n//}\n\n * hoge";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Block quote after itemization", () => {
  // In Re:VIEW format, newline should exist after itemization
  const sbContent = "\thoge\n>aaa\nhoge";
  const reviewCode = " * hoge\n\n//quote{\naaa\n//}\n\nhoge";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("lines larger than baseHeadingLevel", () => {
  const sbContent = "[******* large!!!]\nh";
  const reviewCode = "@<strong>{large!!!}\n\nh";
  assertConvertion(sbContent, reviewCode, {
    hasTitle: false,
    baseHeadingLevel: 3,
  });
});

Deno.test("enlarged image", () => {
  const sbContent = "[*** [https://scrapbox.io/files/aaaaa.jpg]]\nimage";
  const reviewCode =
    "//indepimage[https://scrapbox.io/files/aaaaa.jpg]\n\nimage";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("enlarged icon", () => {
  const sbContent = "[*** [https://example.org/hoge.jpg]]を";
  const reviewCode = "@<icon>{https://example.org/hoge.jpg}を";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Numbered list without indent", () => {
  const sbContent = "1. hoge\n2.  fuga";
  const reviewCode = "1. hoge\n\n2.  fuga";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Basic number list", () => {
  const sbContent = " 1. hoge\n 2. \`fuga\`";
  const reviewCode = " 1. hoge\n 2. @<code>{fuga}";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Basic number list with start number which is not 1", () => {
  const sbContent = " 10. hoge\n 11. fuga";
  const reviewCode = "//olnum[10]\n\n 10. hoge\n 11. fuga";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});

Deno.test("Blank", () => {
  const sbContent = "[https://example.com [ ]link text]";
  const reviewCode = "[@<href>{https://example.com}  link text]";
  assertConvertion(sbContent, reviewCode, { hasTitle: false });
});
