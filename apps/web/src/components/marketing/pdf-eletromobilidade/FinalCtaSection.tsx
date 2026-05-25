import { PurchaseCard } from "./PurchaseCard";

export function FinalCtaSection() {
  return (
    <section className="bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] py-20">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Pronto para entender o mercado antes dos outros?
        </h2>
        <p className="text-green-100 mb-10">
          40+ páginas com os dados reais do mercado de eletromobilidade no Brasil. Quem entender as
          regras agora, captura o ciclo.
        </p>
        <div className="max-w-md mx-auto">
          <PurchaseCard />
        </div>
      </div>
    </section>
  );
}
