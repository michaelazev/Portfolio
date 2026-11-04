import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export const Field = ({ label, hint, children, className }) => {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      {children(id)}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
};

export const TextField = ({ label, hint, value, onChange, className, ...props }) => (
  <Field label={label} hint={hint} className={className}>
    {(id) => <input id={id} className="field py-2.5" value={value ?? ""} onChange={(event) => onChange(event.target.value)} {...props} />}
  </Field>
);

export const TextArea = ({ label, hint, value, onChange, rows = 4, className, ...props }) => (
  <Field label={label} hint={hint} className={className}>
    {(id) => <textarea id={id} rows={rows} className="field resize-y py-2.5" value={value ?? ""} onChange={(event) => onChange(event.target.value)} {...props} />}
  </Field>
);

export const Toggle = ({ label, checked, onChange }) => (
  <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold select-none">
    <input type="checkbox" checked={!!checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" />
    {label}
  </label>
);

export const Panel = ({ title, description, children, className }) => (
  <section className={cn("rounded-2xl border bg-card/80 p-5 backdrop-blur-sm md:p-6", className)}>
    {title && <h2 className="text-lg font-bold">{title}</h2>}
    {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    <div className={title || description ? "mt-5" : ""}>{children}</div>
  </section>
);

export const IconButton = ({ label, className, children, ...props }) => (
  <button type="button" aria-label={label} title={label} className={cn("rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-30", className)} {...props}>
    {children}
  </button>
);

export const SmallButton = ({ className, children, ...props }) => (
  <button type="button" className={cn("inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-50", className)} {...props}>
    {children}
  </button>
);

/** Exclusão em dois cliques, sem caixa de diálogo do navegador. */
export const ConfirmDelete = ({ label, onConfirm, children }) => {
  const [armed, setArmed] = useState(false);
  if (armed) {
    return (
      <button
        type="button"
        autoFocus
        onBlur={() => setArmed(false)}
        onClick={onConfirm}
        className="rounded-lg bg-destructive px-2.5 py-1.5 text-xs font-bold text-white"
      >
        Confirmar exclusão
      </button>
    );
  }
  return (
    <IconButton label={label} className="hover:bg-destructive/10 hover:text-destructive" onClick={() => setArmed(true)}>
      {children}
    </IconButton>
  );
};
