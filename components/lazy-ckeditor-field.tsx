"use client";

import { ComponentType, useEffect, useState } from "react";

type Props = { value: string; onChange: (value: string) => void };

/**
 * Keep CKEditor out of the initial admin bundle. CKEditor has a large browser
 * only dependency graph and loading it during the dashboard render can leave
 * a stale Webpack module in the dev overlay. It is imported only when an
 * editor is actually mounted, with a graceful fallback if the package fails
 * to initialise.
 */
export default function LazyCkEditorField(props: Props) {
  const [Editor, setEditor] = useState<ComponentType<Props> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    import("./ckeditor-field")
      .then((module) => {
        if (active) setEditor(() => module.default);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (Editor) return <Editor {...props} />;
  if (failed)
    return (
      <textarea
        className="ckeditor-fallback"
        value={props.value.replace(/<[^>]+>/g, "")}
        onChange={(event) => props.onChange(event.target.value)}
        rows={12}
        placeholder="Write page content here…"
      />
    );
  return <div className="ckeditor-loading">Loading editor…</div>;
}
