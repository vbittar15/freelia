import Link from "next/link";
import { Lia } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <Lia size={96} mood="worry" color="#FF7EB6" />
      <h1 className="h1 mt-6">No encontramos esta página</h1>
      <p className="text-muted mt-2">Puede que se haya eliminado o que no tengas acceso.</p>
      <Link href="/" className="btn btn-primary btn-lg mt-6">Volver al inicio</Link>
    </div>
  );
}
