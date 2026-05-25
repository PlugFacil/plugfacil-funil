export function LpFooter() {
  return (
    <footer className="bg-[#0a0a0a] py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-white font-bold text-lg">PlugFácil</p>
          <p className="text-gray-500 text-sm">Mobilidade Elétrica Ltda.</p>
          <p className="text-gray-600 text-xs mt-1">CNPJ 66.053.337/0001-75</p>
        </div>
        <div className="text-center md:text-right">
          <p className="text-gray-500 text-sm">contato@plugfacil.com.br</p>
          <p className="text-gray-500 text-sm">(12) 98850-6961</p>
          <p className="text-gray-600 text-xs mt-2">São José dos Campos, SP · Brasil</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-8 pt-6 border-t border-white/5">
        <p className="text-gray-600 text-xs text-center">
          Projeções são estimativas. A PlugFácil não garante retorno financeiro. ·{" "}
          <a href="/privacidade" className="hover:text-gray-400 underline">
            Privacidade
          </a>{" "}
          ·{" "}
          <a href="/termos" className="hover:text-gray-400 underline">
            Termos
          </a>
        </p>
      </div>
    </footer>
  );
}
