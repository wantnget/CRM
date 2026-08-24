"use client";

import { Bold, Italic, Paperclip, Underline, Image as ImageIcon } from "lucide-react";
import { forwardRef, useRef } from "react";

/**
 * Editor de cuerpo con formato básico (negrita, cursiva, subrayado) e
 * inserción de imágenes, usado por el composer de respuesta (ComposerCorreo).
 * Es solo UI: usa contentEditable + document.execCommand, sin persistencia
 * de verdad.
 */
export const EditorCuerpoCorreo = forwardRef<
  HTMLDivElement,
  { placeholder?: string; contenidoInicial?: string }
>(
  function EditorCuerpoCorreo(
    { placeholder = "Escribe un mensaje...", contenidoInicial },
    ref,
  ) {
    const inputImagenRef = useRef<HTMLInputElement>(null);

    function editor(): HTMLDivElement | null {
      return typeof ref === "function" ? null : (ref?.current ?? null);
    }

    function formatear(comando: "bold" | "italic" | "underline") {
      editor()?.focus();
      document.execCommand(comando);
    }

    function insertarImagen(archivo: File) {
      const lector = new FileReader();
      lector.onload = () => {
        editor()?.focus();
        document.execCommand("insertImage", false, String(lector.result));
      };
      lector.readAsDataURL(archivo);
    }

    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Cuerpo del correo"
          data-placeholder={placeholder}
          className="min-h-[6rem] flex-1 overflow-y-auto px-4 py-3 text-sm text-foreground outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)] [&_img]:mt-2 [&_img]:max-h-40 [&_img]:rounded-md"
        >
          {contenidoInicial}
        </div>

        <div className="flex items-center gap-1 border-t border-border px-3 py-2">
          <button
            type="button"
            title="Negrita"
            onClick={() => formatear("bold")}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Bold className="size-4" />
          </button>
          <button
            type="button"
            title="Cursiva"
            onClick={() => formatear("italic")}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Italic className="size-4" />
          </button>
          <button
            type="button"
            title="Subrayado"
            onClick={() => formatear("underline")}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Underline className="size-4" />
          </button>

          <span className="mx-1 h-5 w-px bg-border" aria-hidden />

          <button
            type="button"
            title="Adjuntar imagen"
            onClick={() => inputImagenRef.current?.click()}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ImageIcon className="size-4" />
          </button>
          <button
            type="button"
            title="Adjuntar archivo"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Paperclip className="size-4" />
          </button>
          <input
            ref={inputImagenRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              if (archivo) insertarImagen(archivo);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    );
  },
);
