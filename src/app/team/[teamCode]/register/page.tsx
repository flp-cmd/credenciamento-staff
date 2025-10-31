"use client";

import { useEffect, useState, FormEvent, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Card, CardContent } from "@/src/components/ui/Card";
import { apiClient } from "@/src/lib/api-client";
import Link from "next/link";

interface Position {
  id: number;
  name: string;
  required_fields: Array<{
    field_id: number;
    field_key: string;
    field_label: string;
    field_type: string;
    required: boolean;
  }>;
}

export default function RegisterStaffPage() {
  const params = useParams();
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const teamCode = params.teamCode as string;

  const loadPositions = useCallback(async () => {
    setIsLoading(true);
    const response = await apiClient.get<{ positions: Position[] }>(
      `/api/positions?team_id=1`,
      teamCode
    );

    if (response.data) {
      setPositions(response.data.positions);
    }
    setIsLoading(false);
  }, [teamCode]);

  useEffect(() => {
    if (!teamCode) return;
    const fetchPositions = async () => {
      await loadPositions();
    };

    fetchPositions();
  }, [teamCode, loadPositions]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPosition) return;

    setError("");
    setIsSubmitting(true);

    const response = await apiClient.post(
      "/api/staff",
      {
        team_id: 1,
        position_id: selectedPosition.id,
        ...formData,
      },
      teamCode
    );

    if (response.error) {
      setError(response.error);
      setIsSubmitting(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/team/${teamCode}/staff`);
      }, 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <svg
              className="mx-auto h-16 w-16 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
              Cadastro Realizado!
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Funcionário cadastrado com sucesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            Sistema de Credenciamento
          </h1>
          <Link href={`/team/${teamCode}`}>
            <Button variant="ghost" size="sm">
              Voltar
            </Button>
          </Link>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Registrar Novo Funcionário
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selecione o Cargo *
                </label>
                <select
                  value={selectedPosition?.id || ""}
                  onChange={(e) => {
                    const pos = positions.find(
                      (p) => p.id === parseInt(e.target.value)
                    );
                    setSelectedPosition(pos || null);
                    setFormData({});
                  }}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Escolha um cargo...</option>
                  {positions.map((position) => (
                    <option key={position.id} value={position.id}>
                      {position.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPosition && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Dados do Funcionário
                    </h3>
                    <div className="space-y-4">
                      {selectedPosition.required_fields.map((field) => (
                        <Input
                          key={field.field_id}
                          label={`${field.field_label}${
                            field.required ? " *" : ""
                          }`}
                          type={
                            field.field_type === "email"
                              ? "email"
                              : field.field_type === "number"
                              ? "number"
                              : "text"
                          }
                          value={formData[field.field_key] || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [field.field_key]: e.target.value,
                            })
                          }
                          required={field.required}
                          placeholder={`Digite o ${field.field_label.toLowerCase()}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Link href={`/team/${teamCode}`} className="flex-1">
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                      >
                        Cancelar
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      isLoading={isSubmitting}
                      className="flex-1"
                    >
                      Cadastrar Funcionário
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
