import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const sourcePath = path.resolve("src/i18n/messages.ts");
const sourceText = fs.readFileSync(sourcePath, "utf8");
const sourceFile = ts.createSourceFile(
  sourcePath,
  sourceText,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
);

function unwrapExpression(expression) {
  let current = expression;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function propertyName(property) {
  const name = property.name;
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  if (ts.isIdentifier(name)) return name.text;
  throw new Error(
    `Unsupported translation key at line ${
      sourceFile.getLineAndCharacterOfPosition(name.pos).line + 1
    }`,
  );
}

function stringValue(property) {
  const value = unwrapExpression(property.initializer);
  if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
    return value.text;
  }
  throw new Error(
    `Translation ${propertyName(property)} must be a static string at line ${
      sourceFile.getLineAndCharacterOfPosition(value.pos).line + 1
    }`,
  );
}

function objectEntries(object, label) {
  if (!ts.isObjectLiteralExpression(object)) {
    throw new Error(`${label} must be an object literal`);
  }
  const entries = new Map();
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) {
      throw new Error(`${label} contains an unsupported property declaration`);
    }
    const key = propertyName(property);
    if (entries.has(key))
      throw new Error(`${label} contains duplicate key ${key}`);
    entries.set(key, stringValue(property));
  }
  return entries;
}

let messagesObject;
for (const statement of sourceFile.statements) {
  if (!ts.isVariableStatement(statement)) continue;
  for (const declaration of statement.declarationList.declarations) {
    if (
      !ts.isIdentifier(declaration.name) ||
      declaration.name.text !== "messages"
    )
      continue;
    messagesObject = unwrapExpression(declaration.initializer);
  }
}

if (!messagesObject || !ts.isObjectLiteralExpression(messagesObject)) {
  throw new Error("Unable to locate the messages object");
}

const localeObjects = new Map();
for (const property of messagesObject.properties) {
  if (!ts.isPropertyAssignment(property)) continue;
  localeObjects.set(
    propertyName(property),
    unwrapExpression(property.initializer),
  );
}

const en = objectEntries(localeObjects.get("en"), "en");
const zhCN = objectEntries(localeObjects.get("zh-CN"), "zh-CN");
const errors = [];
const placeholderPattern = /\{([A-Za-z][A-Za-z0-9_]*)\}/g;
const placeholders = (value) =>
  [...value.matchAll(placeholderPattern)].map((match) => match[1]).sort();

for (const [key, enValue] of en) {
  if (!zhCN.has(key)) {
    errors.push(`zh-CN missing key: ${key}`);
    continue;
  }
  const zhValue = zhCN.get(key);
  if (!enValue.trim()) errors.push(`en has empty value: ${key}`);
  if (!zhValue.trim()) errors.push(`zh-CN has empty value: ${key}`);
  if (placeholders(enValue).join(",") !== placeholders(zhValue).join(",")) {
    errors.push(`placeholder mismatch: ${key}`);
  }
  if (/\bNetBird\b/.test(enValue) || /\bNetBird\b/.test(zhValue)) {
    errors.push(`legacy brand in translation: ${key}`);
  }
}

for (const key of zhCN.keys()) {
  if (!en.has(key)) errors.push(`zh-CN has extra key: ${key}`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`i18n check passed: ${en.size} keys in en and zh-CN`);
