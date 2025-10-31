"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import { Navbar } from "@/src/components/layout/Navbar";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Card, CardContent } from "@/src/components/ui/Card";
import { apiClient } from "@/src/lib/api-client";

interface Staff {
  id: number;
  team_id: number;
  position_id: number;
  name?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  created_at: string;
}

interface Team {
  id: number;
  name: string;
}

export default function EventStaffPage() {
  const params = useParams();
  const router = useRouter();
  const { admin, token } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const eventId = params.eventId as string;

  useEffect(() => {
    if (!admin) {
      router.push("/login");
      return;
    }
  }, [admin, router]);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    const [teamsRes, staffRes] = await Promise.all([
      apiClient.get<{ teams: Team[] }>(
        `/api/teams?event_id=${eventId}`,
        token!
      ),
      apiClient.get<{ staff: Staff[]; total: number }>(
        `/api/staff?event_id=${eventId}`,
        token!
      ),
    ]);

    if (teamsRes.data) {
      setTeams(teamsRes.data.teams);
    }

    if (staffRes.data) {
      setStaff(staffRes.data.staff);
    }

    setIsLoading(false);
  }, [eventId, token]);

  useEffect(() => {
    if (!token && !eventId) return;
    const fetchData = async () => {
      await loadData();
    };

    fetchData();
  }, [token, eventId, loadData]);

  // const getTeamName = (teamId: number) => {
  //   return teams.find((t) => t.id === teamId)?.name || "N/A";
  // };

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
          title="Todos os Funcionários"
          description="Relatório completo de todos os credenciados do evento"
          breadcrumbs={[
            { label: "Eventos", href: "/dashboard" },
            { label: "Detalhes", href: `/events/${eventId}` },
            { label: "Funcionários" },
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total de Equipes
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {teams.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total de Funcionários
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {staff.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Média por Equipe
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {teams.length > 0 ? Math.round(staff.length / teams.length) : 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {teams.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                Nenhuma equipe cadastrada ainda.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {team.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Visualize os funcionários desta equipe na página de detalhes
                    da equipe.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
