"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { evaluate } from "@/lib/evaluate";
import { supabase, type Calc } from "@/lib/supabase";

const OPERATORS = "+-*/";
const PRETTY: Record<string, string> = { "*": "×", "/": "÷", "-": "−" };
const pretty = (s: string) => s.replace(/[*/-]/g, (c) => PRETTY[c]);

const BUTTONS = [
  "C", "⌫", "(", ")",
  "7", "8", "9", "/",
  "4", "5", "6", "*",
  "1", "2", "3", "-",
  "0", ".", "=", "+",
];

export default function Calculator() {
  const [expr, setExpr] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [history, setHistory] = useState<Calc[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("calcs")
      .select("id, expression, result, created_at")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data, error }) => {
        if (error) setDbError(`Couldn't load history: ${error.message}`);
        else setHistory(data);
      });
  }, []);

  async function save(expression: string, value: string) {
    const { data, error } = await supabase
      .from("calcs")
      .insert({ expression, result: value })
      .select()
      .single();
    if (error) {
      setDbError(`Couldn't save: ${error.message}`);
      return;
    }
    setDbError(null);
    setHistory((h) => [data as Calc, ...h].slice(0, 10));
  }

  function append(ch: string) {
    let base = expr;
    if (justEvaluated) {
      // Operator continues from the last result; anything else starts fresh.
      base = OPERATORS.includes(ch) && result !== null ? result : "";
      setJustEvaluated(false);
    }
    setResult(null);

    const last = base.at(-1) ?? "";

    if (OPERATORS.includes(ch)) {
      // Unary minus is allowed at the start, after "(", or after * and /.
      if (ch === "-" && (last === "" || last === "(" || last === "*" || last === "/")) {
        setExpr(base + ch);
        return;
      }
      const trimmed = base.replace(/[+\-*/]+$/, "");
      if (trimmed === "" || trimmed.endsWith("(")) return;
      setExpr(trimmed + ch);
      return;
    }

    if (ch === ".") {
      const currentNumber = base.match(/[\d.]*$/)?.[0] ?? "";
      if (currentNumber.includes(".")) return;
      setExpr(base + (currentNumber === "" ? "0." : "."));
      return;
    }

    if (ch === ")") {
      const open = (base.match(/\(/g) ?? []).length;
      const close = (base.match(/\)/g) ?? []).length;
      if (open <= close || last === "(" || OPERATORS.includes(last)) return;
    }

    setExpr(base + ch);
  }

  function backspace() {
    if (justEvaluated) {
      setJustEvaluated(false);
      setResult(null);
      return;
    }
    setResult(null);
    setExpr((e) => e.slice(0, -1));
  }

  function clear() {
    setExpr("");
    setResult(null);
    setJustEvaluated(false);
  }

  function equals() {
    if (expr === "" || justEvaluated) return;
    try {
      const value = evaluate(expr);
      setResult(value);
      setJustEvaluated(true);
      void save(expr, value);
    } catch {
      // Leave the expression editable so it can be fixed.
      setResult("Error");
    }
  }

  function press(key: string) {
    if (key === "C") clear();
    else if (key === "⌫") backspace();
    else if (key === "=") equals();
    else append(key);
  }

  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    let key: string | null = null;
    if (/^[0-9.+\-*/()]$/.test(e.key)) key = e.key;
    else if (e.key === "Enter" || e.key === "=") key = "=";
    else if (e.key === "Backspace") key = "⌫";
    else if (e.key === "Escape" || e.key === "Delete") key = "C";
    if (key === null) return;
    // Also stops Enter from "clicking" a focused button a second time.
    e.preventDefault();
    press(key);
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKeyDown(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isError = result === "Error";

  return (
    <div className="w-full max-w-xs">
      <div className="rounded-2xl bg-zinc-900 p-4 shadow-lg">
        <div className="mb-4 flex min-h-24 flex-col items-end justify-end break-all rounded-lg bg-zinc-800 px-3 py-2 font-mono">
          <div className={result === null ? "text-3xl text-white" : "text-sm text-zinc-400"}>
            {pretty(expr) || "0"}
          </div>
          {result !== null && (
            <div className={`text-3xl ${isError ? "text-red-400" : "text-white"}`}>
              {isError ? result : `= ${pretty(result)}`}
            </div>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {BUTTONS.map((b) => {
            const style =
              b === "="
                ? "bg-orange-500 hover:bg-orange-400 text-white"
                : OPERATORS.includes(b)
                  ? "bg-zinc-600 hover:bg-zinc-500 text-orange-300"
                  : b === "C" || b === "⌫" || b === "(" || b === ")"
                    ? "bg-zinc-700 hover:bg-zinc-600 text-zinc-200"
                    : "bg-zinc-800 hover:bg-zinc-700 text-white";
            return (
              <button
                key={b}
                type="button"
                onClick={() => press(b)}
                className={`h-14 rounded-xl text-xl font-medium transition-colors ${style}`}
              >
                {PRETTY[b] ?? b}
              </button>
            );
          })}
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          History
        </h2>
        {dbError && <p className="mb-2 text-sm text-red-500">{dbError}</p>}
        {history.length === 0 ? (
          <p className="text-sm text-zinc-500">No calculations yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 font-mono text-sm dark:divide-zinc-800">
            {history.map((c) => (
              <li key={c.id} className="flex justify-between gap-4 py-2">
                <span className="break-all text-zinc-500">{pretty(c.expression)}</span>
                <span className="font-semibold">= {pretty(c.result)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
