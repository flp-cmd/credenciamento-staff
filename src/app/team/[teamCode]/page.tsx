"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/src/components/ui/Card";
import { apiClient } from "@/src/lib/api-client";
import Link from "next/link";

interface Team {
  id: number;
  name: string;
  responsible_name?: string;
}

interface Position {
  id: number;
  name: string;
}

export default function TeamLeaderPage() {
  const params = useParams();
  const [team, setTeam] = useState<Team | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const teamCode = params.teamCode as string;

  const loadTeamData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const teamRes = await apiClient.get<{ staff: unknown[] }>(
      `/api/staff?position_id=1`,
      teamCode
    );

    if (teamRes.error) {
      setError("Código de equipe inválido");
      setIsLoading(false);
      return;
    }

    const positionsRes = await apiClient.get<{ positions: Position[] }>(
      `/api/positions?team_id=1`,
      teamCode
    );

    if (positionsRes.data) {
      setPositions(positionsRes.data.positions);
    }

    setTeam({ id: 1, name: "Equipe" });
    setIsLoading(false);
  }, [teamCode]);

  useEffect(() => {
    if (!teamCode) return;

    const fetchTeamData = async () => {
      await loadTeamData();
    };

    fetchTeamData();
  }, [teamCode, loadTeamData]);

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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">
              Código Inválido
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            Sistema de Credenciamento
          </h1>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {team?.name}
          </h2>
          {team?.responsible_name && (
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Responsável: {team.responsible_name}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href={`/team/${teamCode}/register`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-8">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg">
                    <svg
                      className="h-10 w-10 text-blue-600 dark:text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Registrar Novo Funcionário
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Cadastrar nova pessoa na equipe
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/team/${teamCode}/staff`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-8">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg">
                    <svg
                      className="h-10 w-10 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Ver Funcionários Cadastrados
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Lista de pessoas já registradas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {positions.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Cargos Disponíveis
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {positions.map((position) => (
                  <div
                    key={position.id}
                    className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 rounded-lg text-center"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {position.name}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
