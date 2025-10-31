"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { Navbar } from "@/src/components/layout/Navbar";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { Card, CardContent } from "@/src/components/ui/Card";
import { apiClient } from "@/src/lib/api-client";

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

interface Field {
  id: number;
  key: string;
  label: string;
  field_type: string;
}

export default function PositionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { admin, token } = useAuth();
  const [position, setPosition] = useState<Position | null>(null);
  const [allFields, setAllFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<Record<number, boolean>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const eventId = params.eventId as string;
  const teamId = params.teamId as string;
  const positionId = params.positionId as string;

  useEffect(() => {
    if (!admin) {
      router.push("/login");
      return;
    }
  }, [admin, router]);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    const [positionRes, fieldsRes] = await Promise.all([
      apiClient.get<{ position: Position }>(
        `/api/positions/${positionId}`,
        token!
      ),
      apiClient.get<{ fields: Field[] }>("/api/fields"),
    ]);

    if (positionRes.data) {
      setPosition(positionRes.data.position);
      const selected: Record<number, boolean> = {};
      positionRes.data.position.required_fields.forEach((field) => {
        if (field.required) {
          selected[field.field_id] = true;
        }
      });
      setSelectedFields(selected);
    }

    if (fieldsRes.data) {
      setAllFields(fieldsRes.data.fields);
    }

    setIsLoading(false);
  }, [positionId, token]);

  useEffect(() => {
    if (!token && !teamId) return;
    const fetchData = async () => {
      await loadData();
    };

    fetchData();
  }, [token, loadData, teamId]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");

    const required_fields = Object.entries(selectedFields)
      .filter(([, isSelected]) => isSelected)
      .map(([fieldId]) => ({
        field_id: parseInt(fieldId),
        required: true,
      }));

    const response = await apiClient.put(
      `/api/positions/${positionId}`,
      { required_fields },
      token!
    );

    if (response.error) {
      setMessage(response.error);
    } else {
      setMessage("Configuração salva com sucesso!");
      setTimeout(() => setMessage(""), 3000);
    }

    setIsSaving(false);
  };

  if (isLoading || !position) {
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title={position.name}
          description="Configure os campos obrigatórios para este cargo"
          breadcrumbs={[
            { label: "Eventos", href: "/dashboard" },
            { label: "Detalhes", href: `/events/${eventId}` },
            { label: "Equipes", href: `/events/${eventId}/teams` },
            { label: "Detalhes", href: `/events/${eventId}/teams/${teamId}` },
            {
              label: "Cargos",
              href: `/events/${eventId}/teams/${teamId}/positions`,
            },
            { label: position.name },
          ]}
        />

        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg ${
              message.includes("sucesso")
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Campos Obrigatórios
              </h3>
              <Button onClick={handleSave} isLoading={isSaving}>
                Salvar Configuração
              </Button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Selecione os campos que devem ser preenchidos obrigatoriamente ao
              cadastrar um funcionário para este cargo.
            </p>

            <div className="space-y-3">
              {allFields.map((field) => (
                <label
                  key={field.id}
                  className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
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
                    className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-400 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {field.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tipo: {field.field_type} • Chave: {field.key}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Resumo: {Object.values(selectedFields).filter(Boolean).length}{" "}
                campos selecionados
              </h4>
              <div className="flex flex-wrap gap-2">
                {allFields
                  .filter((f) => selectedFields[f.id])
                  .map((field) => (
                    <span
                      key={field.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                    >
                      {field.label}
                    </span>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
