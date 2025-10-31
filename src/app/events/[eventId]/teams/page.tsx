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

interface Team {
  id: number;
  name: string;
  responsible_name?: string;
  responsible_email?: string;
  team_code: string;
}

export default function EventTeamsPage() {
  const params = useParams();
  const router = useRouter();
  const { admin, token } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const eventId = params.eventId as string;

  useEffect(() => {
    if (!admin) {
      router.push("/login");
      return;
    }
  }, [admin, router]);

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    const response = await apiClient.get<{ teams: Team[]; total: number }>(
      `/api/teams?event_id=${eventId}`,
      token!
    );

    if (response.data) {
      setTeams(response.data.teams);
    }
    setIsLoading(false);
  }, [eventId, token]);

  useEffect(() => {
    if (!token && !eventId) return;
    const fetchTeams = async () => {
      await loadTeams();
    };
    fetchTeams();
  }, [token, eventId, loadTeams]);

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
          title="Equipes"
          description="Gerencie as equipes do evento"
          breadcrumbs={[
            { label: "Eventos", href: "/dashboard" },
            { label: "Detalhes", href: `/events/${eventId}` },
            { label: "Equipes" },
          ]}
          action={
            <Button onClick={() => setShowCreateModal(true)}>
              + Criar Equipe
            </Button>
          }
        />

        {teams.length === 0 ? (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                Nenhuma equipe cadastrada
              </h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Comece criando sua primeira equipe.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowCreateModal(true)}>
                  + Criar Primeira Equipe
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Link key={team.id} href={`/events/${eventId}/teams/${team.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {team.name}
                    </h3>
                    {team.responsible_name && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span className="font-medium">Responsável:</span>{" "}
                        {team.responsible_name}
                      </p>
                    )}
                    {team.responsible_email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        <span className="font-medium">Email:</span>{" "}
                        {team.responsible_email}
                      </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                        Código: {team.team_code}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateTeamModal
          eventId={eventId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadTeams();
          }}
          token={token!}
        />
      )}
    </div>
  );
}

function CreateTeamModal({
  eventId,
  onClose,
  onSuccess,
  token,
}: {
  eventId: string;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
}) {
  const [name, setName] = useState("");
  const [responsibleName, setResponsibleName] = useState("");
  const [responsibleEmail, setResponsibleEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const response = await apiClient.post(
      "/api/teams",
      {
        event_id: parseInt(eventId),
        name,
        responsible_name: responsibleName || undefined,
        responsible_email: responsibleEmail || undefined,
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Criar Nova Equipe
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input
            label="Nome da Equipe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ex: Equipe de Segurança"
          />

          <Input
            label="Nome do Responsável"
            value={responsibleName}
            onChange={(e) => setResponsibleName(e.target.value)}
            placeholder="Ex: João Silva"
          />

          <Input
            label="Email do Responsável"
            type="email"
            value={responsibleEmail}
            onChange={(e) => setResponsibleEmail(e.target.value)}
            placeholder="responsavel@email.com"
          />

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
              Criar Equipe
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
