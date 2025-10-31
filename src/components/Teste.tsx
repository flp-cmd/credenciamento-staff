// src/components/TestDark.tsx
export function TestDark() {
  return (
    <div className="p-4 space-y-4">
      {/* Teste 1: Background básico */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded">
        <p className="text-slate-900 dark:text-white">
          Se você está vendo este texto mudar de cor, está funcionando!
        </p>
      </div>

      {/* Teste 2: Card */}
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded border border-slate-200 dark:border-slate-700">
        <h3 className="text-slate-900 dark:text-white font-bold">Card Teste</h3>
        <p className="text-slate-600 dark:text-slate-300">
          Este é um card de teste
        </p>
      </div>

      {/* Teste 3: Input */}
      <input
        type="text"
        placeholder="Digite algo"
        className="
            w-full px-4 py-2 rounded
            bg-white dark:bg-slate-800
            border border-slate-300 dark:border-slate-600
            text-slate-900 dark:text-white
            placeholder:text-slate-400
          "
      />

      {/* Teste 4: Botão */}
      <button
        className="
          px-4 py-2 rounded
          bg-blue-500 dark:bg-blue-600
          hover:bg-blue-600 dark:hover:bg-blue-700
          text-white
        "
      >
        Botão Teste
      </button>
    </div>
  );
}
