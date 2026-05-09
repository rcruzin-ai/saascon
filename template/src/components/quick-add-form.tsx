"use client";

import { useActionState, useEffect, useRef } from "react";
import { createEntry, type QuickAddState } from "@/app/actions";

const INITIAL: QuickAddState = { error: null, ok: false };

export function QuickAddForm() {
  const [state, formAction, pending] = useActionState(createEntry, INITIAL);
  const formRef = useRef<HTMLFormElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      nameRef.current?.focus();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
      aria-labelledby="quick-add-heading"
    >
      <h2 id="quick-add-heading" className="text-sm font-semibold uppercase tracking-wide text-gray-500">
        Quick add
      </h2>

      <Field label="Name" htmlFor="qa-name">
        <input
          ref={nameRef}
          id="qa-name"
          name="name"
          type="text"
          required
          maxLength={80}
          autoComplete="off"
          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-base text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
        />
      </Field>

      <Field label="Calories" htmlFor="qa-calories">
        <input
          id="qa-calories"
          name="calories"
          type="text"
          required
          inputMode="numeric"
          pattern="[0-9]*"
          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-base tabular-nums text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
        />
      </Field>

      <fieldset className="grid grid-cols-3 gap-2">
        <legend className="sr-only">Optional macros in grams</legend>
        <MacroField label="Protein g" htmlFor="qa-protein" name="protein_g" />
        <MacroField label="Carbs g" htmlFor="qa-carbs" name="carbs_g" />
        <MacroField label="Fat g" htmlFor="qa-fat" name="fat_g" />
      </fieldset>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 disabled:opacity-60"
      >
        {pending ? "Adding…" : "Log it"}
      </button>
    </form>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function MacroField({ label, htmlFor, name }: { label: string; htmlFor: string; name: string }) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-700">{label}</span>
      <input
        id={htmlFor}
        name={name}
        type="text"
        inputMode="decimal"
        pattern="[0-9]*\.?[0-9]*"
        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-2 text-sm tabular-nums text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
      />
    </label>
  );
}
