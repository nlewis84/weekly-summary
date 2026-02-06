"use strict";

const HARDCODED_PATTERN =
  /\b(text-gray-|bg-gray-|text-red-|text-green-|bg-red-|bg-green-|border-gray-|border-red-|border-green-)/;

function getStringValue(node) {
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }
  if (node.type === "TemplateLiteral") {
    return node.quasis.map((q) => q.value.raw).join("");
  }
  return null;
}

function isInClassName(node) {
  let parent = node.parent;
  while (parent) {
    if (parent.type === "JSXAttribute" && parent.name?.name === "className") {
      return true;
    }
    if (parent.type === "Property" && parent.key?.name === "className") {
      return true;
    }
    parent = parent.parent;
  }
  return false;
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow hardcoded Tailwind colors (text-gray-*, bg-gray-*, text-red-*, text-green-*). Use theme variables. See docs/STYLE-GUIDE.md",
    },
    schema: [],
  },
  create(context) {
    return {
      Literal(node) {
        if (!isInClassName(node)) return;
        const value = getStringValue(node);
        if (value && HARDCODED_PATTERN.test(value)) {
          context.report({
            node,
            message:
              "Use theme variables instead of hardcoded colors (e.g. text-[var(--color-text)]). See docs/STYLE-GUIDE.md",
          });
        }
      },
      TemplateLiteral(node) {
        if (!isInClassName(node)) return;
        const value = getStringValue(node);
        if (value && HARDCODED_PATTERN.test(value)) {
          context.report({
            node,
            message:
              "Use theme variables instead of hardcoded colors (e.g. text-[var(--color-text)]). See docs/STYLE-GUIDE.md",
          });
        }
      },
    };
  },
};
