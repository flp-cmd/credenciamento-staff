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
  position_id: number;
  name?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  address?: string;
  car_plate?: string;
  created_at: string;
}

interface Position {
  id: number;
  name: string;
}

export default function TeamStaffPage() {
  const params = useParams();
  const router = useRouter();
  const { admin, token } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const eventId = params.eventId as string;
  const teamId = params.teamId as string;

  useEffect(() => {
    if (!admin) {
      router.push("/login");
      return;
    }
  }, [admin, router]);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    const [staffRes, positionsRes] = await Promise.all([
      apiClient.get<{ staff: Staff[] }>(`/api/staff?team_id=${teamId}`, token!),
      apiClient.get<{ positions: Position[] }>(
        `/api/positions?team_id=${teamId}`,
        token!
      ),
    ]);

    if (staffRes.data) {
      setStaff(staffRes.data.staff);
    }

    if (positionsRes.data) {
      setPositions(positionsRes.data.positions);
    }

    setIsLoading(false);
  }, [teamId, token]);

  useEffect(() => {
    if (!token && !teamId) return;
    const fetchData = async () => {
      await loadData();
    };

    fetchData();
  }, [token, teamId, loadData]);

  const getPositionName = (positionId: number) => {
    return positions.find((p) => p.id === positionId)?.name || "N/A";
  };

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
          title="Funcionários da Equipe"
          description={`Total: ${staff.length} funcionários cadastrados`}
          breadcrumbs={[
            { label: "Eventos", href: "/dashboard" },
            { label: "Detalhes", href: `/events/${eventId}` },
            { label: "Equipes", href: `/events/${eventId}/teams` },
            { label: "Detalhes", href: `/events/${eventId}/teams/${teamId}` },
            { label: "Funcionários" },
          ]}
        />

        {staff.length === 0 ? (
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
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                Nenhum funcionário cadastrado
              </h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Os funcionários serão cadastrados pelo líder da equipe usando o
                código de acesso.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {staff.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {member.name || "N/A"}
                      </div>
                      {member.cpf && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          CPF: {member.cpf}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {getPositionName(member.position_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {member.email || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {member.phone || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(member.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
