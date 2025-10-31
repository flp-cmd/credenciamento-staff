"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { Navbar } from "@/src/components/layout/Navbar";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Button } from "@/src/components/ui/Button";
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

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { admin, token } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const eventId = params.eventId as string;
  const teamId = params.teamId as string;

  useEffect(() => {
    if (!admin) {
      router.push("/login");
      return;
    }
  }, [admin, router]);

  const loadTeam = useCallback(async () => {
    setIsLoading(true);
    const response = await apiClient.get<{ team: Team }>(
      `/api/teams/${teamId}`,
      token!
    );

    if (response.data) {
      setTeam(response.data.team);
    }
    setIsLoading(false);
  }, [teamId, token]);

  useEffect(() => {
    if (!token && !teamId) return;
    const fetchTeams = async () => {
      await loadTeam();
    };

    fetchTeams();
  }, [token, teamId, loadTeam]);

  const copyTeamCode = () => {
    if (team) {
      navigator.clipboard.writeText(team.team_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyTeamLink = () => {
    if (team) {
      const link = `${window.location.origin}/team/${team.team_code}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading || !team) {
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
          title={team.name}
          breadcrumbs={[
            { label: "Eventos", href: "/dashboard" },
            { label: "Detalhes", href: `/events/${eventId}` },
            { label: "Equipes", href: `/events/${eventId}/teams` },
            { label: team.name },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Informações da Equipe
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nome da Equipe
                  </p>
                  <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {team.name}
                  </p>
                </div>
                {team.responsible_name && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Responsável
                    </p>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                      {team.responsible_name}
                    </p>
                  </div>
                )}
                {team.responsible_email && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Email do Responsável
                    </p>
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                      {team.responsible_email}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Código de Acesso
              </h3>
              <div className="space-y-3">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    Team Code
                  </p>
                  <p className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                    {team.team_code}
                  </p>
                </div>
                <Button
                  onClick={copyTeamCode}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  {copied ? "Copiado!" : "Copiar Código"}
                </Button>
                <Button
                  onClick={copyTeamLink}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  Copiar Link de Acesso
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href={`/events/${eventId}/teams/${teamId}/positions`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
                    <svg
                      className="h-8 w-8 text-blue-600 dark:text-blue-400"
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
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Gerenciar Cargos
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configurar cargos e campos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/events/${eventId}/teams/${teamId}/staff`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg">
                    <svg
                      className="h-8 w-8 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Ver Funcionários
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Lista de staff cadastrado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
                  <svg
                    className="h-8 w-8 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Link do Líder
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    /team/{team.team_code.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
