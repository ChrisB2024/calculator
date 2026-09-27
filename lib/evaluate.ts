// Evaluates an arithmetic expression without eval().
// Grammar (recursive descent):
//   expr   = term (("+" | "-") term)*
//   term   = factor (("*" | "/" | implied) factor)*
//   factor = ("+" | "-") factor | number | "(" expr ")"

type Token = { type: "num"; value: number } | { type: "op"; value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === " ") {
      i++;
    } else if ("+-*/()".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i++;
    } else if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < input.length && /[0-9.]/.test(input[j])) j++;
      const raw = input.slice(i, j);
      if (!/^(\d+\.?\d*|\.\d+)$/.test(raw)) throw new Error(`Bad number: ${raw}`);
      tokens.push({ type: "num", value: parseFloat(raw) });
      i = j;
    } else {
      throw new Error(`Unexpected character: ${ch}`);
    }
  }
  return tokens;
}

export function evaluate(input: string): string {
  const tokens = tokenize(input);
  let pos = 0;

  const peek = () => tokens[pos];
  const isOp = (v: string) => peek()?.type === "op" && peek().value === v;

  function expr(): number {
    let value = term();
    while (isOp("+") || isOp("-")) {
      const op = tokens[pos++].value;
      const rhs = term();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  // Implied multiplication: 9(6-3), (2)(3), (1+2)4.
  const impliedMul = () =>
    isOp("(") || (peek()?.type === "num" && tokens[pos - 1]?.value === ")");

  function term(): number {
    let value = factor();
    while (isOp("*") || isOp("/") || impliedMul()) {
      const op = impliedMul() ? "*" : tokens[pos++].value;
      const rhs = factor();
      if (op === "/" && rhs === 0) throw new Error("Division by zero");
      value = op === "*" ? value * rhs : value / rhs;
    }
    return value;
  }

  function factor(): number {
    const tok = peek();
    if (!tok) throw new Error("Unexpected end of expression");
    if (isOp("+") || isOp("-")) {
      pos++;
      const v = factor();
      return tok.value === "-" ? -v : v;
    }
    if (tok.type === "num") {
      pos++;
      return tok.value;
    }
    if (isOp("(")) {
      pos++;
      const v = expr();
      if (!isOp(")")) throw new Error("Missing )");
      pos++;
      return v;
    }
    throw new Error(`Unexpected ${tok.value}`);
  }

  if (tokens.length === 0) throw new Error("Empty expression");
  const result = expr();
  if (pos !== tokens.length) throw new Error(`Unexpected ${tokens[pos].value}`);
  if (!Number.isFinite(result)) throw new Error("Result is not finite");

  // toPrecision strips float noise (0.1 + 0.2 -> "0.3"); Object.is guards against "-0".
  const rounded = parseFloat(result.toPrecision(12));
  return String(Object.is(rounded, -0) ? 0 : rounded);
}
