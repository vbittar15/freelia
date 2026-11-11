import Link from "next/link";
import { Lia } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <Lia size={72} mood="calm" />
      <h1 className="mt-6 text-[22px] font-semibold">No encontramos esta página</h1>
      <p className="text-muted mt-2">Puede que se haya eliminado o que no tengas acceso.</p>
      <Link href="/" className="btn btn-primary mt-6">Volver al inicio</Link>
    </div>
  );
}
