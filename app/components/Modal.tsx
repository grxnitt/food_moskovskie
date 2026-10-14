"use client";
import { useEffect, useRef, ReactNode } from "react";
import { X } from "lucide-react";
export default function Modal({ children, onClose, title, className = "" }: { children: ReactNode; onClose: () => void; title: string; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current!.showModal(); const old = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = old; }; }, []);
  return <dialog ref={ref} aria-label={title} className={`modal ${className}`} onClose={onClose} onClick={event => { if (event.target === ref.current) onClose(); }}><div className="modal-inner"><button className="icon-button modal-close" onClick={onClose} aria-label="Закрыть"><X size={21} /></button>{children}</div></dialog>;
}
