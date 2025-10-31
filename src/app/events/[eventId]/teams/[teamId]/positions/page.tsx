"use client";

import { useEffect, useState, FormEvent, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { Navbar } from "@/src/components/layout/Navbar";
import { PageHeader } from "@/src/components/layout/PageHeader";
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
    required: boolean;
  }>;
}

interface Field {
  id: number;
  key: string;
  label: string;
  field_type: string;
}

export default function PositionsPage() {
  const params = useParams();
  const router = useRouter();
  const { admin, token } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const eventId = params.eventId as string;
  const teamId = params.teamId as string;

  useEffect(() => {
    if (!admin) {
      router.push("/login");
      return;
    }
  }, [admin, router]);

  const loadPositions = useCallback(async () => {
    setIsLoading(true);
    const response = await apiClient.get<{
      positions: Position[];
      total: number;
    }>(`/api/positions?team_id=${teamId}`, token!);

    if (response.data) {
      setPositions(response.data.positions);
    }
    setIsLoading(false);
  }, [teamId, token]);

  useEffect(() => {
    if (!token && !teamId) return;
    const fetchPositions = async () => {
      await loadPositions();
    };

    fetchPositions();
  }, [token, teamId, loadPositions]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Carregando...
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Cargos"
          description="Gerencie os cargos e campos obrigatórios"
          breadcrumbs={[
            { label: "Eventos", href: "/dashboard" },
            { label: "Detalhes", href: `/events/${eventId}` },
            { label: "Equipes", href: `/events/${eventId}/teams` },
            { label: "Detalhes", href: `/events/${eventId}/teams/${teamId}` },
            { label: "Cargos" },
          ]}
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              + Criar Cargo
            </Button>
          }
        />

        {positions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                Nenhum cargo cadastrado
              </h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Comece criando o primeiro cargo para esta equipe.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowCreateModal(true)}>
                  + Criar Primeiro Cargo
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {positions.map((position) => (
              <Link
                key={position.id}
                href={`/events/${eventId}/teams/${teamId}/positions/${position.id}`}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      {position.name}
                    </h3>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">
                          Campos obrigatórios:
                        </span>{" "}
                        {
                          position.required_fields.filter((f) => f.required)
                            .length
                        }
                      </p>
                      {position.required_fields.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {position.required_fields
                            .filter((f) => f.required)
                            .slice(0, 3)
                            .map((field) => (
                              <span
                                key={field.field_id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                              >
                                {field.field_label}
                              </span>
                            ))}
                          {position.required_fields.filter((f) => f.required)
                            .length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300">
                              +
                              {position.required_fields.filter(
                                (f) => f.required
                              ).length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreatePositionModal
          teamId={teamId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPositions();
          }}
          token={token!}
        />
      )}
    </div>
  );
}

function CreatePositionModal({
  teamId,
  onClose,
  onSuccess,
  token,
}: {
  teamId: string;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
}) {
  const [name, setName] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<Record<number, boolean>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadFields = useCallback(async () => {
    const response = await apiClient.get<{ fields: Field[] }>("/api/fields");
    if (response.data) {
      setFields(response.data.fields);
    }
  }, []);

  useEffect(() => {
    const fetchFields = async () => {
      await loadFields();
    };

    fetchFields();
  }, [loadFields]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const required_fields = Object.entries(selectedFields)
      .filter(([, isSelected]) => isSelected)
      .map(([fieldId]) => ({
        field_id: parseInt(fieldId),
        required: true,
      }));

    const response = await apiClient.post(
      "/api/positions",
      {
        team_id: parseInt(teamId),
        name,
        required_fields:
          required_fields.length > 0 ? required_fields : undefined,
      },
      token
    );

    if (response.error) {
      setError(response.error);
      setIsLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 my-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Criar Novo Cargo
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input
            label="Nome do Cargo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ex: Operador de Câmera"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Campos Obrigatórios
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
              {fields.map((field) => (
                <label
                  key={field.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedFields[field.id] || false}
                    onChange={(e) =>
                      setSelectedFields({
                        ...selectedFields,
                        [field.id]: e.target.checked,
                      })
                    }
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {field.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading} className="flex-1">
              Criar Cargo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
